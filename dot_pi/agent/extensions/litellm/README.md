# LiteLLM provider for pi

Adds a `LiteLLM` provider backed by LiteLLM's OpenAI-compatible API.

## Setup

1. Run `/reload` after installing or changing the extension.
2. Run `/login` and choose **LiteLLM**.
3. Enter the LiteLLM endpoint (for example `https://litellm.example.com/v1`) and API key.
4. Open `/model` and select a `litellm/...` model.

The endpoint and key are saved in pi's normal credential store. The extension never reads `litellm.key`; that file was only used for local testing and can be deleted.

You can alternatively configure the provider non-interactively:

```sh
export LITELLM_BASE_URL=https://litellm.example.com/v1
export LITELLM_API_KEY=sk-...
pi
```

## Data loaded

- Model access is discovered from `GET /v1/models` (or `GET /models`).
- Pricing, context limits, modality, reasoning support, and blocked status are merged from `GET /model/info` when the key can access it.
- Token usage is read from LiteLLM's OpenAI-compatible streaming usage object.
- When LiteLLM returns `x-litellm-response-cost`, that exact request cost replaces the local estimate.
- `/litellm-usage` queries LiteLLM's key-info and 30-day activity endpoints for spend, budget, token, and request totals. Availability depends on the key's permissions and whether LiteLLM has a spend database.

Opening `/model` refreshes the dynamic model catalog. The catalog is also refreshed after `/login`.
