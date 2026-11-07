const SITE_ = 'https://nancy098517.github.io/';
const WORKS_ = [
  ['島遊趣', 'island-fun/'],
  ['碳足跡', 'carbon-footprint.html'],
  ['應付帳款自動化', 'ap-automation.html'],
  ['ERP 條碼', 'erp-barcode.html'],
  ['家庭探險', 'family-adventure/'],
  ['旅遊作品', 'travel.html']
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Chat')
    .setTitle('Nancy AI 小幫手')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function sendChat(history, question) {
  if (typeof question !== 'string' || !question.trim() || question.length > 500) {
    return {error: '請輸入 1～500 字的問題。'};
  }
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('NANCY_CHAT_MODE') !== 'live') {
    return {reply: '【預覽回覆】嗨！我是 Nancy 小幫手。你可以從首頁找到島遊趣、碳足跡和流程自動化作品。'};
  }
  const key = properties.getProperty('OPENROUTER_API_KEY');
  if (!key) return {error: 'AI 客服尚未設定完成，請稍後再試。'};

  const recent = Array.isArray(history) ? history.slice(-6).filter(item =>
    item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string'
  ).map(item => ({role: item.role, content: item.content.slice(0, 600)})) : [];
  const works = WORKS_.map(([name, path]) => name + ' ' + SITE_ + path).join('\n');
  const messages = [
    {role: 'system', content: '你是 Nancy 網站的作品導覽。用繁體中文簡短回答，只依以下公開資料介紹作品。資料不足時請說明，勿捏造資訊或網址。可把作品網址單獨放在一行。\n' + works},
    ...recent,
    {role: 'user', content: question.trim()}
  ];

  try {
    if (!reserveCall_(properties)) return {error: '客服今日已達使用上限，請明天再試。'};
    return callOpenRouter_(key, properties.getProperty('OPENROUTER_MODEL') || 'anthropic/claude-haiku-5.5', messages);
  } catch (error) {
    return {error: '客服暫時無法回覆，請稍後再試。'};
  }
}

function reserveCall_(properties) {
  const lock = LockService.getScriptLock();
  lock.waitLock(3000);
  try {
    const date = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    const [lastDate, rawCount] = (properties.getProperty('NANCY_CHAT_USAGE') || '').split(':');
    const count = lastDate === date ? Number(rawCount) || 0 : 0;
    if (count >= 50) return false;
    properties.setProperty('NANCY_CHAT_USAGE', date + ':' + (count + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

function callOpenRouter_(key, model, messages) {
  const response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {Authorization: 'Bearer ' + key},
    payload: JSON.stringify({model, messages, max_tokens: 500}),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  if (status === 402) return {error: 'AI 客服額度暫時用完，請稍後再試。'};
  if (status === 429) return {error: 'AI 客服目前忙碌，請稍後再試。'};
  if (status !== 200) return {error: 'AI 服務暫時無法回覆，請稍後再試。'};
  const reply = JSON.parse(response.getContentText()).choices?.[0]?.message?.content;
  return typeof reply === 'string' && reply.trim()
    ? {reply: reply.trim()}
    : {error: '這次沒有收到回覆，請再試一次。'};
}
