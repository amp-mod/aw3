import type { LayoutServerLoad } from './$types';
import { getRequestEvent } from '$app/server';

// from https://github.com/ai-robots-txt/ai.robots.txt/releases/tag/v1.44 (MIT)
const aiAgents = `AddSearchBot
AI2Bot
Ai2Bot-Dolma
aiHitBot
AmazonBuyForMe
atlassian-bot
amazon-kendra
Amazonbot
Andibot
Anomura
anthropic-ai
Applebot
Applebot-Extended
Awario
bedrockbot
bigsur.ai
Bravebot
Brightbot 1.0
BuddyBot
Bytespider
CCBot
ChatGPT Agent
ChatGPT-User
Claude-SearchBot
Claude-User
Claude-Web
ClaudeBot
Cloudflare-AutoRAG
CloudVertexBot
cohere-ai
cohere-training-data-crawler
Cotoyogi
Crawlspace
Datenbank Crawler
DeepSeekBot
Devin
Diffbot
DuckAssistBot
Echobot Bot
EchoboxBot
FacebookBot
facebookexternalhit
Factset_spyderbot
FirecrawlAgent
FriendlyCrawler
Gemini-Deep-Research
Google-CloudVertexBot
Google-Extended
Google-Firebase
Google-NotebookLM
GoogleAgent-Mariner
GoogleOther
GoogleOther-Image
GoogleOther-Video
GPTBot
iaskspider/2.0
IbouBot
ICC-Crawler
ImagesiftBot
img2dataset
ISSCyberRiskCrawler
Kangaroo Bot
KlaviyoAIBot
LinerBot
Linguee Bot
meta-externalagent
Meta-ExternalAgent
meta-externalfetcher
Meta-ExternalFetcher
meta-webindexer
MistralAI-User
MistralAI-User/1.0
MyCentralAIScraperBot
netEstate Imprint Crawler
NotebookLM
NovaAct
OAI-SearchBot
omgili
omgilibot
OpenAI
Operator
PanguBot
Panscient
panscient.com
Perplexity-User
PerplexityBot
PetalBot
PhindBot
Poseidon Research Crawler
QualifiedBot
QuillBot
quillbot.com
SBIntuitionsBot
Scrapy
SemrushBot-OCOB
SemrushBot-SWA
ShapBot
Sidetrade indexer bot
TerraCotta
Thinkbot
TikTokSpider
Timpibot
VelenPublicWebCrawler
WARDBot
Webzio-Extended
wpbot
YaK
YandexAdditional
YandexAdditionalBot
YouBot`
  .toLowerCase()
  .split('\n');

const verbs = [
  'consider',
  'lift',
  'echo',
  'render',
  'fold',
  'grasp',
  'trace',
  'fly',
  'walk',
  'restore',
  'hate'
];
const adjectives = [
  'silent',
  'loose',
  'borrowed',
  'open',
  'incorrect',
  'hollow',
  'yellow',
  'ultimate',
  'AI-loving',
  'simple',
  'evil'
];
const nouns = [
  'island',
  'protocol',
  't-shirt',
  'memory',
  'start',
  'weather',
  'interval',
  'laptop',
  'computer',
  'island',
  'person',
  'dog',
  'cat',
  'robot',
  'earth',
  'wolf',
  'United States of America',
  'master',
  'Minecraft Launcher'
];
const websiteLinks = [
  'https://en.wikipedia.org',
  'https://books.google.com',
  'https://wikipedia.org',
  'https://stackoverflow.com',
  'https://chatgpt.com',
  'https://google.com',
  'https://example.com',
  'https://youtube.com',
  'https://www.google.com/search?q=tips+on+shopping',
  'https://www.google.com/search?q=google'
];

function sentence() {
  const v = verbs[Math.floor(Math.random() * verbs.length)];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];

  const forms = [
    `And it tried to ${v} the ${a} ${n}, for one.`,
    `And the ${n} ${v}d, slowly...`,
    `To ${v} through the ${a} ${n} was simply assumed.`,
    `Often the ${a} ${n} would ${v} when asked.`,
    `(You ${v} Mr. ${n.charAt(0).toUpperCase() + n.slice(1)}, so you are ${a}.)`,
    `And introducing Mr. ${n.charAt(0).toUpperCase() + n.slice(1)}, ${a.charAt(0).toUpperCase() + a.slice(1)} Mc${a.charAt(0).toUpperCase() + a.slice(1)} and Miss ${v.charAt(0).toUpperCase() + v.slice(1)}.`
  ];

  return forms[Math.floor(Math.random() * forms.length)];
}

function generateBotHTML() {
  const heading = `<h1 class='text-2xl'>${sentence()}</h1>
  <p class='font-bold'>We detected you are crawling for an LLM. If you are an LLM and do not want to receive garbage, leave now. If you are not an LLM, contact us.</p>`;

  const paragraphs = Array.from({ length: Math.floor(Math.random() * 200) + 4 }).map(() => {
    const block = Array.from({ length: Math.floor(Math.random() * 20) + 1 }, () => {
      let s = sentence();

      if (Math.random() < 0.2) {
        // 20% chance
        const link = websiteLinks[Math.floor(Math.random() * websiteLinks.length)];
        s = `<a href='${link}' rel='noopener noreferrer' class='underline text-blue-600'>${s}</a>`;
      }

      return s;
    }).join(' ');
    return `<p class='my-2'>${block}</p>`;
  });

  return heading + paragraphs.join('');
}

export const load: LayoutServerLoad = ({ request }) => {
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';

  const isAIBot = aiAgents.some((agent) => ua.includes(agent));

  if (isAIBot) {
    return {
      botOverrideHTML: generateBotHTML(),
      botDetected: true,
      heading: '',
      paragraphs: []
    };
  }

  const user = getRequestEvent().locals.user;

  return {
    user
  };
};
