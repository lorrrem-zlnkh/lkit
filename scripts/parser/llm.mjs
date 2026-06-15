// LLM-модуль парсера: переписывает определение «своими словами» в стиле словаря.
// Автоопределение провайдера: Claude (ANTHROPIC_API_KEY) — приоритет; иначе
// OpenAI (OPENAI_API_KEY), как в существующем expand_dictionary.mjs.
// Модель можно переопределить переменной LLM_MODEL.
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `Ты пишешь определения для русскоязычного словаря IT-сленга и жаргона.
Перепиши определение термина СВОИМИ СЛОВАМИ — это должен быть оригинальный текст, а не копия источника.
Стиль: живой, разговорный, как в обычном объяснении «на пальцах»; 2–3 предложения; по-русски.
Правила:
- Англицизмы, названия технологий и продуктов (API, backend, Docker, Python, Git и т. п.) НЕ переводи на русский — оставляй как есть.
- Не копируй формулировки источника дословно — передай смысл своими словами.
- Без вступлений и мета-комментариев, без рассуждений — выводи ТОЛЬКО сам текст определения.
- Начинай естественно, можно с самого термина (например: «Бэкап — это …»).`;

export function getLLM() {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
    const client = new Anthropic();
    const model = process.env.LLM_MODEL || "claude-opus-4-8";
    return {
      name: `claude:${model}`,
      async rewrite(term, raw) {
        const resp = await client.messages.create({
          model,
          max_tokens: 600,
          output_config: { effort: "low" },
          system: SYSTEM,
          messages: [{
            role: "user",
            content: `Термин: ${term}\nИсходное определение (из источника, только как опора — НЕ копировать дословно):\n${raw}`,
          }],
        });
        const block = resp.content.find((b) => b.type === "text");
        return (block?.text || "").trim();
      },
    };
  }

  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    const model = process.env.LLM_MODEL || "gpt-4o-mini";
    return {
      name: `openai:${model}`,
      async rewrite(term, raw) {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            max_tokens: 400,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: `Термин: ${term}\nИсходное определение (опора, не копировать):\n${raw}` },
            ],
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json));
        return json.choices[0].message.content.trim();
      },
    };
  }

  return null; // ключей нет — режим без LLM (--no-llm)
}
