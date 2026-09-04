import {
	createAssistantMessageEventStream,
	createProvider,
	type ApiKeyCredential,
	type AssistantMessage,
	type AssistantMessageEventStream,
	type Context,
	type Model,
	type ProviderResponse,
	type ProviderStreams,
	type SimpleStreamOptions,
	type StreamOptions,
	openAICompletionsApi,
} from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROVIDER_ID = "litellm";
const ENDPOINT_ENV = "LITELLM_BASE_URL";
const API_KEY_ENV = "LITELLM_API_KEY";
const DEFAULT_CONTEXT_WINDOW = 128_000;
const DEFAULT_MAX_TOKENS = 16_384;

type JsonObject = Record<string, unknown>;
type LiteLLMModel = Model<"openai-completions">;

interface CatalogResult {
	models: LiteLLMModel[];
	modelInfoAvailable: boolean;
}

function isObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asObject(value: unknown): JsonObject {
	return isObject(value) ? value : {};
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
	const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
	return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		if (value.toLowerCase() === "true") return true;
		if (value.toLowerCase() === "false") return false;
	}
	return undefined;
}

function unique<T>(values: T[]): T[] {
	return [...new Set(values)];
}

/**
 * Accept either a LiteLLM server URL, an OpenAI base URL ending in /v1, or a
 * full chat-completions URL. Keep path prefixes used by reverse proxies.
 */
function normalizeEndpoint(input: string): string {
	let value = input.trim().replace(/\/+$/, "");
	value = value.replace(/\/(?:chat\/completions|responses)$/i, "");

	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error("LiteLLM endpoint must be an absolute http(s) URL");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error("LiteLLM endpoint must use http or https");
	}
	if (url.username || url.password) throw new Error("Do not include credentials in the LiteLLM endpoint URL");
	url.search = "";
	url.hash = "";
	return url.toString().replace(/\/$/, "");
}

function appendPath(base: string, suffix: string): string {
	return `${base.replace(/\/+$/, "")}/${suffix.replace(/^\/+/, "")}`;
}

function managementBase(endpoint: string): string {
	return endpoint.replace(/\/v1$/i, "");
}

function modelListUrls(endpoint: string): string[] {
	const isV1 = /\/v1$/i.test(endpoint);
	return unique([
		appendPath(endpoint, "models"),
		...(isV1 ? [] : [appendPath(endpoint, "v1/models")]),
	]);
}

function modelInfoUrls(endpoint: string): string[] {
	const root = managementBase(endpoint);
	return unique([
		`${appendPath(root, "v2/model/info")}?page=1&page_size=1000`,
		appendPath(root, "model/info"),
		appendPath(endpoint, "model/info"),
	]);
}

async function responseError(response: Response): Promise<string> {
	const text = (await response.text()).replace(/\s+/g, " ").trim();
	return `${response.status} ${response.statusText}${text ? `: ${text.slice(0, 400)}` : ""}`;
}

async function fetchJson(url: string, apiKey: string, signal: AbortSignal): Promise<unknown> {
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		signal,
	});
	if (!response.ok) throw new Error(await responseError(response));
	return response.json();
}

async function fetchFirstJson(
	urls: string[],
	apiKey: string,
	signal: AbortSignal,
	required: boolean,
): Promise<unknown | undefined> {
	const errors: string[] = [];
	for (const url of urls) {
		try {
			return await fetchJson(url, apiKey, signal);
		} catch (error) {
			if (signal.aborted) throw error;
			errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	if (required) {
		throw new Error(`Could not query LiteLLM. ${errors.join("; ")}`);
	}
	return undefined;
}

function recordsFrom(payload: unknown): JsonObject[] {
	if (Array.isArray(payload)) return payload.filter(isObject);
	if (!isObject(payload)) return [];
	const data = payload.data ?? payload.models ?? payload.results;
	return Array.isArray(data) ? data.filter(isObject) : [];
}

function publicModelId(record: JsonObject): string | undefined {
	return asString(record.id) ?? asString(record.model_name) ?? asString(record.model);
}

function modelInfoId(record: JsonObject): string | undefined {
	return asString(record.model_name) ?? asString(record.id) ?? asString(asObject(record.model_info).key);
}

function mergedMetadata(record: JsonObject): JsonObject {
	return {
		...record,
		...asObject(record.litellm_params),
		...asObject(record.model_info),
	};
}

function values(records: JsonObject[], keys: string[]): unknown[] {
	const output: unknown[] = [];
	for (const record of records) {
		const metadata = mergedMetadata(record);
		for (const key of keys) {
			if (metadata[key] !== undefined && metadata[key] !== null) output.push(metadata[key]);
		}
	}
	return output;
}

function firstString(records: JsonObject[], keys: string[]): string | undefined {
	for (const value of values(records, keys)) {
		const result = asString(value);
		if (result) return result;
	}
	return undefined;
}

function positiveNumbers(records: JsonObject[], keys: string[]): number[] {
	return values(records, keys)
		.map(asNumber)
		.filter((value): value is number => value !== undefined && value > 0);
}

function ratePerMillion(records: JsonObject[], perTokenKeys: string[], perMillionKeys: string[] = []): number {
	const perMillion = positiveNumbers(records, perMillionKeys);
	if (perMillion.length > 0) return Math.max(...perMillion);
	const perToken = positiveNumbers(records, perTokenKeys);
	return perToken.length > 0 ? Math.max(...perToken) * 1_000_000 : 0;
}

function supports(records: JsonObject[], keys: string[]): boolean {
	return values(records, keys).some((value) => asBoolean(value) === true);
}

function inputModalities(records: JsonObject[]): string[] {
	const modalities: string[] = [];
	for (const value of values(records, ["input_modalities", "modalities"])) {
		if (Array.isArray(value)) {
			modalities.push(...value.filter((item): item is string => typeof item === "string"));
		} else if (typeof value === "string") {
			modalities.push(...value.split(/[,+]/));
		}
	}
	return modalities.map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function isChatModel(records: JsonObject[]): boolean {
	const blocked = values(records, ["blocked"])
		.map(asBoolean)
		.filter((value): value is boolean => value !== undefined);
	if (blocked.length > 0 && blocked.every(Boolean)) return false;

	const mode = firstString(records, ["mode"])?.toLowerCase();
	if (!mode) return true;
	return !new Set([
		"audio_speech",
		"audio_transcription",
		"embedding",
		"image_generation",
		"moderation",
		"rerank",
		"search",
		"video_generation",
	]).has(mode);
}

function buildModel(id: string, endpoint: string, records: JsonObject[]): LiteLLMModel | undefined {
	if (!isChatModel(records)) return undefined;

	const contextCandidates = positiveNumbers(records, ["max_input_tokens", "context_window", "max_tokens"]);
	const contextWindow = contextCandidates.length > 0 ? Math.min(...contextCandidates) : DEFAULT_CONTEXT_WINDOW;
	const outputCandidates = positiveNumbers(records, ["max_output_tokens"]);
	const maxTokens = Math.min(
		contextWindow,
		outputCandidates.length > 0 ? Math.min(...outputCandidates) : DEFAULT_MAX_TOKENS,
	);
	const reasoning = supports(records, ["supports_reasoning", "supports_reasoning_content"]);
	const modalities = inputModalities(records);
	const vision = supports(records, ["supports_vision", "supports_image_input"]) || modalities.includes("image");
	const displayName = firstString(records, ["display_name"]) ?? id;

	return {
		id,
		name: displayName,
		api: "openai-completions",
		provider: PROVIDER_ID,
		baseUrl: endpoint,
		reasoning,
		input: vision ? ["text", "image"] : ["text"],
		cost: {
			input: ratePerMillion(records, ["input_cost_per_token", "prompt_cost_per_token"], ["input_cost_per_million_tokens"]),
			output: ratePerMillion(records, ["output_cost_per_token", "completion_cost_per_token"], ["output_cost_per_million_tokens"]),
			cacheRead: ratePerMillion(records, ["cache_read_input_token_cost", "cache_read_cost_per_token"]),
			cacheWrite: ratePerMillion(records, ["cache_creation_input_token_cost", "cache_write_input_token_cost"]),
		},
		contextWindow,
		maxTokens,
		compat: {
			supportsDeveloperRole: false,
			supportsReasoningEffort: reasoning,
			supportsUsageInStreaming: true,
			maxTokensField: "max_tokens",
		},
	};
}

async function fetchCatalog(endpointInput: string, apiKey: string, signal: AbortSignal): Promise<CatalogResult> {
	const endpoint = normalizeEndpoint(endpointInput);
	const modelsPayload = await fetchFirstJson(modelListUrls(endpoint), apiKey, signal, true);
	const publicRecords = recordsFrom(modelsPayload);
	if (publicRecords.length === 0) throw new Error("LiteLLM returned no models for this API key");

	const infoPayload = await fetchFirstJson(modelInfoUrls(endpoint), apiKey, signal, false);
	const infoRecords = recordsFrom(infoPayload);
	const infoById = new Map<string, JsonObject[]>();
	for (const record of infoRecords) {
		const id = modelInfoId(record);
		if (!id) continue;
		const existing = infoById.get(id) ?? [];
		existing.push(record);
		infoById.set(id, existing);
	}

	const seen = new Set<string>();
	const models: LiteLLMModel[] = [];
	for (const publicRecord of publicRecords) {
		const id = publicModelId(publicRecord);
		if (!id || seen.has(id)) continue;
		seen.add(id);
		const model = buildModel(id, endpoint, [publicRecord, ...(infoById.get(id) ?? [])]);
		if (model) models.push(model);
	}

	models.sort((a, b) => a.id.localeCompare(b.id));
	if (models.length === 0) throw new Error("LiteLLM returned no chat-capable models for this API key");
	return { models, modelInfoAvailable: infoRecords.length > 0 };
}

function credentialConfig(credential: ApiKeyCredential | undefined): { endpoint?: string; apiKey?: string } {
	return {
		endpoint: credential?.env?.[ENDPOINT_ENV] ?? process.env[ENDPOINT_ENV],
		apiKey: credential?.key ?? process.env[API_KEY_ENV],
	};
}

function responseCost(response: ProviderResponse): number | undefined {
	for (const name of ["x-litellm-response-cost", "x-litellm-response-cost-original"]) {
		const value = asNumber(response.headers[name]);
		if (value !== undefined) return value;
	}
	return undefined;
}

function failedMessage(model: Model<"openai-completions">, error: unknown): AssistantMessage {
	return {
		role: "assistant",
		content: [],
		api: model.api,
		provider: model.provider,
		model: model.id,
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason: "error",
		errorMessage: error instanceof Error ? error.message : String(error),
		timestamp: Date.now(),
	};
}

/** Use LiteLLM's exact response cost when it is present; token usage still comes from the OpenAI-compatible stream. */
function wrapCostStream(
	model: Model<"openai-completions">,
	source: AssistantMessageEventStream,
	getCost: () => number | undefined,
): AssistantMessageEventStream {
	const output = createAssistantMessageEventStream();
	void (async () => {
		try {
			for await (const event of source) {
				if (event.type === "done" || event.type === "error") {
					const actualCost = getCost();
					const message = event.type === "done" ? event.message : event.error;
					if (actualCost !== undefined) message.usage.cost.total = actualCost;
				}
				output.push(event);
			}
		} catch (error) {
			output.push({ type: "error", reason: "error", error: failedMessage(model, error) });
		} finally {
			output.end();
		}
	})();
	return output;
}

function streamsWithLiteLLMCost(base: ProviderStreams): ProviderStreams {
	return {
		stream(model, context: Context, options?: StreamOptions) {
			let actualCost: number | undefined;
			const source = base.stream(model, context, {
				...options,
				onResponse: async (response, responseModel) => {
					actualCost = responseCost(response);
					await options?.onResponse?.(response, responseModel);
				},
			});
			return wrapCostStream(model as Model<"openai-completions">, source, () => actualCost);
		},
		streamSimple(model, context: Context, options?: SimpleStreamOptions) {
			let actualCost: number | undefined;
			const source = base.streamSimple(model, context, {
				...options,
				onResponse: async (response, responseModel) => {
					actualCost = responseCost(response);
					await options?.onResponse?.(response, responseModel);
				},
			});
			return wrapCostStream(model as Model<"openai-completions">, source, () => actualCost);
		},
	};
}

async function optionalJson(url: string, apiKey: string, signal: AbortSignal): Promise<unknown | undefined> {
	try {
		return await fetchJson(url, apiKey, signal);
	} catch (error) {
		if (signal.aborted) throw error;
		return undefined;
	}
}

function formatMoney(value: number): string {
	return value < 0.01 ? `$${value.toFixed(6)}` : `$${value.toFixed(2)}`;
}

function usageSummary(keyPayload: unknown, activityPayload: unknown): string {
	const keyRoot = asObject(keyPayload);
	const info = isObject(keyRoot.info) ? keyRoot.info : keyRoot;
	const metadata = asObject(asObject(activityPayload).metadata);
	const spend = asNumber(info.spend) ?? asNumber(metadata.total_spend);
	const budget = asNumber(info.max_budget);
	const promptTokens = asNumber(metadata.total_prompt_tokens);
	const completionTokens = asNumber(metadata.total_completion_tokens);
	const requests = asNumber(metadata.total_api_requests);
	const expires = asString(info.expires);

	const parts: string[] = [];
	if (spend !== undefined) parts.push(`spend ${formatMoney(spend)}`);
	if (budget !== undefined && budget > 0) parts.push(`budget ${formatMoney(budget)}`);
	if (promptTokens !== undefined || completionTokens !== undefined) {
		parts.push(`30d tokens ${(promptTokens ?? 0).toLocaleString()} in / ${(completionTokens ?? 0).toLocaleString()} out`);
	}
	if (requests !== undefined) parts.push(`30d requests ${requests.toLocaleString()}`);
	if (expires) parts.push(`expires ${expires}`);
	return parts.length > 0 ? `LiteLLM: ${parts.join(" · ")}` : "LiteLLM returned no spend or usage fields for this key.";
}

export default function litellmExtension(pi: ExtensionAPI) {
	const provider = createProvider<"openai-completions">({
		id: PROVIDER_ID,
		name: "LiteLLM",
		baseUrl: process.env[ENDPOINT_ENV],
		auth: {
			apiKey: {
				name: "LiteLLM endpoint and API key",
				async login(interaction) {
					const endpoint = normalizeEndpoint(
						await interaction.prompt({
							type: "text",
							message: "LiteLLM endpoint",
							placeholder: "http://localhost:4000 or https://litellm.example.com/v1",
						}),
					);
					const apiKey = (
						await interaction.prompt({
							type: "secret",
							message: "LiteLLM API key",
							placeholder: "sk-...",
						})
					).trim();
					if (!apiKey) throw new Error("LiteLLM API key is required");

					interaction.notify({ type: "progress", message: "Validating LiteLLM and loading models…" });
					const catalog = await fetchCatalog(endpoint, apiKey, interaction.signal);
					interaction.notify({
						type: "info",
						message: `Connected to LiteLLM. Found ${catalog.models.length} models${catalog.modelInfoAvailable ? " with pricing and capability metadata" : ""}.`,
					});
					return { type: "api_key", key: apiKey, env: { [ENDPOINT_ENV]: endpoint } };
				},
				async check({ ctx, credential }) {
					const endpoint = credential?.env?.[ENDPOINT_ENV] ?? (await ctx.env(ENDPOINT_ENV));
					const apiKey = credential?.key ?? (await ctx.env(API_KEY_ENV));
					return endpoint && apiKey
						? { type: "api_key", source: credential ? "stored LiteLLM credentials" : `${ENDPOINT_ENV} + ${API_KEY_ENV}` }
						: undefined;
				},
				async resolve({ ctx, credential }) {
					const endpointInput = credential?.env?.[ENDPOINT_ENV] ?? (await ctx.env(ENDPOINT_ENV));
					const apiKey = credential?.key ?? (await ctx.env(API_KEY_ENV));
					if (!endpointInput || !apiKey) return undefined;
					const endpoint = normalizeEndpoint(endpointInput);
					return {
						auth: { apiKey, baseUrl: endpoint },
						env: { [ENDPOINT_ENV]: endpoint },
						source: credential ? "stored LiteLLM credentials" : `${ENDPOINT_ENV} + ${API_KEY_ENV}`,
					};
				},
			},
		},
		models: [],
		async fetchModels({ credential, signal }) {
			const config = credentialConfig(credential?.type === "api_key" ? credential : undefined);
			if (!config.endpoint || !config.apiKey) return [];
			return (await fetchCatalog(config.endpoint, config.apiKey, signal)).models;
		},
		api: streamsWithLiteLLMCost(openAICompletionsApi()),
	});

	pi.registerProvider(provider);

	pi.registerCommand("litellm-usage", {
		description: "Show spend, budget, and recent token usage for the configured LiteLLM key",
		handler: async (_args, ctx) => {
			const auth = await ctx.modelRegistry.getProviderAuth(PROVIDER_ID);
			const endpointInput = auth?.auth.baseUrl;
			const apiKey = auth?.auth.apiKey;
			if (!endpointInput || !apiKey) {
				ctx.ui.notify("LiteLLM is not configured. Run /login and select LiteLLM.", "warning");
				return;
			}

			const endpoint = normalizeEndpoint(endpointInput);
			const root = managementBase(endpoint);
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 15_000);
			try {
				const today = new Date();
				const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
				const date = (value: Date) => value.toISOString().slice(0, 10);
				const [keyInfo, activity] = await Promise.all([
					optionalJson(appendPath(root, "key/info"), apiKey, controller.signal),
					optionalJson(
						`${appendPath(root, "user/daily/activity")}?start_date=${date(start)}&end_date=${date(today)}`,
						apiKey,
						controller.signal,
					),
				]);
				if (keyInfo === undefined && activity === undefined) {
					ctx.ui.notify("LiteLLM usage endpoints are unavailable to this key or the proxy has no spend database.", "warning");
					return;
				}
				ctx.ui.notify(usageSummary(keyInfo, activity), "info");
			} catch (error) {
				ctx.ui.notify(`Could not load LiteLLM usage: ${error instanceof Error ? error.message : String(error)}`, "error");
			} finally {
				clearTimeout(timeout);
			}
		},
	});
}
