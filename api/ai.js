export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const apiKey = process.env.DOUBAO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "服务器尚未配置模型密钥" });
  }

  try {
    const { text, prompt } = req.body || {};
    const input = [
      prompt || "请识别以下文献内容，提取标题、作者、年份、期刊或出版社、DOI，并按 GB/T 7714 格式生成参考文献。",
      text || "",
    ].join("\n\n");

    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "doubao-seed-2-0-lite-260428",
          input,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "模型请求失败",
      });
    }

    const answer =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.map((item) => item.text || "")
        ?.filter(Boolean)
        ?.join("\n") ||
      "";

    return res.status(200).json({ result: answer, raw: data });
  } catch (error) {
    return res.status(500).json({ error: "服务器处理失败，请稍后重试" });
  }
}
