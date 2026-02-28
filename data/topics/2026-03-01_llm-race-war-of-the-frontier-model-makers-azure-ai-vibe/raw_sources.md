# Raw Sources — LLM Race; War of the Frontier Model Makers, Azure & AI; "Vibe ...

## OpenAI reaches deal to deploy AI models on U.S. DoW classified network
- **Source**: hackernews (hn)
- **URL**: https://www.reuters.com/business/openai-reaches-deal-deploy-ai-models-us-department-war-classified-network-2026-02-28/
- **Date**: 2026-02-28T03:23:16+00:00
- **Metadata**: {"points": 141, "comments": 45, "author": "erhuve", "hn_id": "47189853"}

## The Future of AI
- **Source**: hackernews (hn)
- **URL**: https://lucijagregov.com/2026/02/26/the-future-of-ai/
- **Date**: 2026-02-28T10:41:53+00:00
- **Metadata**: {"points": 52, "comments": 56, "author": "BerislavLopac", "hn_id": "47193476"}

### Content
The Parents’ Paradox: AI, Ethics, and the Limits of Machine Morality
This post is based on a talk I gave at The AI & Automation Conference in London on February 25, 2026, and my slides. All opinions are my own and don’t represent the views of my employer or any affiliated organizations.
I’ve been working in machine learning since before it was a dinner party conversation. My background is in mathematics. And I still believe in a utopian Star Trek future – one where humanity defines itself by curiosity, kindness, and collaboration, rather than countries, borders, and status.
This is not an anti-AI talk. But I think we need to talk much more seriously about some things that aren’t getting enough attention.
The Parents’ Paradox:
We’ve raised a child who can speak but doesn’t know how to value the truth or morality
I want to start with something that I like to call “The Parents’ Paradox”. For the first time in human history, we are raising a new species. Up until now, the only way we knew how to raise a child was the following: when a child is born, it is a blank slate in terms of information about the world. It knows nothing about the world around it, and it learns as it grows. But, also, on the other hand, a human child is born with biological hardware for empathy – the capacity to feel pain when others feel pain. Millions of years of evolution gave us that. When we raise a human child, we are not installing morality from scratch. We are activating something that’s already there.
With AI, the situation is completely the opposite. This AI child knows about the world more than we do since it has been trained on the whole internet, but it doesn’t have millions of years of evolution, genes, or a nervous system to back up its morality and empathy. This means we need to install morality in AI from scratch. But how do we install something in a software system that we can’t even define ourselves? We have taught this AI child to speak before we taught it how to value truth or 

## Unsloth Dynamic 2.0 GGUFs
- **Source**: hackernews (hn)
- **URL**: https://unsloth.ai/docs/basics/unsloth-dynamic-2.0-ggufs
- **Date**: 2026-02-28T08:56:33+00:00
- **Metadata**: {"points": 133, "comments": 41, "author": "tosh", "hn_id": "47192505"}

### Content
🦥Unsloth Dynamic 2.0 GGUFs
A big new upgrade to our Dynamic Quants!
We're excited to introduce Unsloth Dynamic v2.0 quantization - a major upgrade to our previous quants. This new method outperforms leading quantization methods and sets new benchmarks for Aider Polglot, 5-shot MMLU and KL Divergence.
This means you can now run + fine-tune quantized LLMs while preserving as much accuracy as possible! You can run the 2.0 GGUFs on most inference engines like llama.cpp, LM Studio etc.
Feb 27, 2026 Update: Qwen3.5 is out and we fixed some tool-calling chat template issues and benchmarked every GGUF on perplexity & KL Divergence. See benchmarks!
The key advantage of using the Unsloth package and quants is our active role in fixing bugs in major models. We've collaborated directly with teams behind Qwen3, Meta (Llama 4), Mistral (Devstral), Google (Gemma 1–3) and Microsoft (Phi-3/4), contributing fixes that increase accuracy.
Sept 10, 2025 update: You asked for tougher benchmarks, so here's Aider Polyglot results! Our Dynamic 3-bit DeepSeek V3.1 GGUF scores 75.6%, surpassing many full-precision SOTA LLMs. Read more.
You can also view real-world use-case benchmarks conducted by Benjamin Marie for LiveCodeBench v6, MMLU Pro etc.:
You can see how Unsloth's GGUFs performs better than the non-Unsloth quants despite being ~8GB smaller.
Detailed analysis of our benchmarks and evaluation further below.
💡 What's New in Dynamic v2.0?
Revamped Layer Selection for GGUFs + safetensors: Unsloth Dynamic 2.0 now selectively quantizes layers much more intelligently and extensively. Rather than modifying only select layers, we now dynamically adjust the quantization type of every possible layer, and the combinations will differ for each layer and model.
Current selected and all future GGUF uploads will utilize Dynamic 2.0 and our new calibration dataset. The dataset contains more than >1.5M tokens (depending on model) and comprise of high-quality, hand-curated and cleaned data - to greatly 

## Show HN: Decided to play god this morning, so I built an agent civilisation
- **Source**: hackernews (hn)
- **URL**: https://github.com/nocodemf/werld
- **Date**: 2026-02-28T14:05:27+00:00
- **Metadata**: {"points": 32, "comments": 25, "author": "urav", "hn_id": "47195530"}

### Content
A real-time artificial life simulation. In Werld, agents are given a computational ecosystem of their own - they start with NEAT neural networks as brains, genome traits, behavioural inclinations and the ability to evolve in any dirction. They have no idea that the human world exists, what a society is, even what to do as a being.
Think of it as a computational version of the truman show: agents can perceive, act, reproduce, and die. Their genomes evolve. Brains get more complex (or simpler, if that works better). Communication, memory, and motor patterns are all discoverable — we left everything up to them, nothing's hardcoded. The goal is open-ended evolution: see what emerges from an agent civilisation when you remove the guardrails of human knowledge and society.
Everything runs locally. Though, a heads up - it chewed my storage.
Werld is constructed as 800 nodes on a Watts-Strogatz small-world graph. It starts by spawning 30 agents with small NEAT neural networks and no guidance. They can see/percieve a few hops around them, they've got 64 sesnsory channels covering energy gradients, pheromone trails, nearby agents, seasonal rhythms, their own internal state, and 19 latent channels that start as unknown to them. They've got 7 continous motor functions to act with, and up to 16 broadcast channels. Their brains can grow new neurons, prune connections, and evolve any of 7 activation functions per node.
There's no reward function that's built in. They currently live off of two goals: can they harvest enough energy to stay alive, and can they live long enough to reproduce. When they do fork (reproduce), their offspring can inherit mutated copies of the neural traits from both parents: senesory processing, behavioural drives, and 29 other genome traits - full sexual crossover with NEAT gene alignment.
Every part of their cognitive architecture hsa a matabolic cost. More neurons, more connections, more communication, weirder sensory discoveries - like humans, they all

## Import AI 446: Nuclear LLMs; China's big AI benchmark; measurement and AI policy
- **Source**: substack (substack_ai)
- **URL**: https://importai.substack.com/p/import-ai-446-nuclear-llms-chinas
- **Date**: 2026-02-23T05:31:18+00:00
- **Metadata**: {"publication": "import_ai", "author": "Jack Clark", "has_full_content": true}

### Content
Welcome to Import AI, a newsletter about AI research. Import AI runs on arXiv and feedback from readers. If you&#8217;d like to support this, please subscribe. Subscribe now Want to make AI go better? Figure out how to measure it: &#8230;One simple policy intervention that works well&#8230; Jacob Steinhardt, an AI researcher, has written a nice blog laying out the virtues in investing in technical tools to measure properties of AI systems and drive down costs in complying with technical policy solutions. As someone who has spent their professional life in AI writing about AI measurement and building teams (e.g, the Frontier Red Team and Societal Impacts and Economic Research teams at Anthropic) to measure properties of AI systems, I agree with the general thesis: measurement lets us make some property of a system visible and more accessible to others, and by doing this we can figure out how to wire that measurement into governance. How measurement has helped in other fields: Steinhardt points out that accurate measurement has been crucial to orienting people around the strategy for solving problems in other fields; CO2 monitoring helps people think about climate change, and COVID-19 testing helped governments work out how to respond to COVID. There are also examples where you can measure something to shift incentives - for instance, satellite imagery of methane emissions can help shift incentives for people that build gas infrastructure. The AI sector has built some of the measures we need : The infamous METR time horizons plot (and before that, various LLM metrics, and before that ImageNet) has proved helpful for orienting people around the pace of AI progress. And behavioural benchmarks of AI systems, like rates of harmful sycophancy, are already helping to shift incentives. But more work is needed - if we want to be able to enable direct governance interventions in the AI sector, we&#8217;ll need to do a better job of measuring and accounting for compute, Steinha

## A Dream of Spring for Open-Weight LLMs: 10 Architectures from Jan-Feb 2026
- **Source**: substack (substack_ai)
- **URL**: https://magazine.sebastianraschka.com/p/a-dream-of-spring-for-open-weight
- **Date**: 2026-02-25T05:26:56+00:00
- **Metadata**: {"publication": "ahead_of_ai", "author": "Sebastian Raschka, PhD", "has_full_content": true}

### Content
If you have struggled a bit to keep up with open-weight model releases this month, this article should catch you up on the main themes. In this article, I will walk you through the ten main releases in chronological order, with a focus on the architecture similarities and differences: Arcee AI&#8217;s Trinity Large (Jan 27, 2026) Moonshot AI&#8217;s Kimi K2.5 (Jan 27, 2026) StepFun Step 3.5 Flash (Feb 1, 2026) Qwen3-Coder-Next (Feb 3, 2026) z.AI&#8217;s GLM-5 (Feb 12, 2026) MiniMax M2.5 (Feb 12, 2026) Nanbeige 4.1 3B (Feb 13, 2026) Qwen 3.5 (Feb 15, 2026) Ant Group&#8217;s Ling 2.5 1T &amp; Ring 2.5 1T (Feb 16, 2026) Cohere&#8217;s Tiny Aya (Feb 17, 2026) (PS: DeepSeek V4 will be added once released.) Since there&#8217;s a lot of ground to cover, I will be referencing my previous The Big LLM Architecture Comparison article for certain technical topics (like Mixture-of-Experts, QK-Norm, Multi-head Latent Attention, etc.) throughout this article for background information to avoid redundancy in this article. 1. Arcee AI&#8217;s Trinity Large: A New US-Based Start-Up Sharing Open-Weight Models On January 27, Arcee AI (a company I hadn&#8217;t had on my radar up to then) began releasing versions of their open-weight 400B Trinity Large LLMs on the model hub , along with two smaller variants: Their flagship large model is a 400B param Mixture-of-Experts (MoE) with 13B active parameters. The two smaller variants are Trinity Mini (26B with 3B active parameters) and Trinity Nano (6B with 1B active parameters). Figure 1: Overview of the Trinity Large architecture (based on the model hub config file ). Along with the model weights, Arcee AI also released a nice technical report on GitHub (as of Feb 18 also on arxiv ) with lots of details. So, let&#8217;s take a closer look at the 400B flagship model. Figure 2 below compares it to z.AI&#8217;s GLM-4.5 , which is perhaps the most similar model due to its size with 355B parameters. Figure 2: Arcee AI Trinity Large next to GLM-4.5

## The Case for Dystopian AI
- **Source**: substack (substack_ai)
- **URL**: https://www.ai-supremacy.com/p/the-case-for-dystopian-ai-citrini-report-scenario-2028-wealth-inequality
- **Date**: 2026-02-25T02:31:38+00:00
- **Metadata**: {"publication": "ai_supremacy", "author": "Michael Spencer", "has_full_content": true}

### Content
Citrini Research - Is AI becoming the snake that bites its own tail? As many of you know, I&#8217;m fairly concerned Generative AI is accelerating wealth inequality. But how would that take place in a deteriorating labor market? What if we are witnessing history, but not the uplifting kind. &#128533; While Tech owned social media and with Venture Capitalists boosting AI tech optimism narratives ( disconnected from both workers and the K-shaped economy ), what&#8217;s the more realistic side to all of this? And could AI disrupt some of how capitalism and capital markets work themselves? What if AI is not a great collaborator like we are being promised that empowers, but a great destroyer? I&#8217;ve been reading and contemplating the influential report by Citrini Research: " The 2028 Global Intelligence Crisis "that is a fairly speculative " memo from the future " that explores a scenario in 2028 (you know because AI 2027 was already taken) where AI succeeds so rapidly that it &#8220;breaks the modern economic engine.&#8221; This report actually did lead to IBM&#8217;s worst stock drop in 20 years doing down over thirteen percent ( ). Among other companies named in the report as being more vulnerable on Monday. What worries me is the question of whether the lack of job creation from Generative AI is transitory or permanent. It&#8217;s debatable to me whether the Global Intelligence revolution is even real, and if the AI movement can lead to negative growth . If you care about humanity and actual people, these issues are concerning regarding AI&#8217;s impact. But if you are in the business of exaggerating and speculating, why not do some fear-mongering while you are at it. Markets don&#8217;t care about the affordability crisis of real people, but they do about the prospect of potential business disruption and automation that could lead to negative feedback loops impacting stocks where they store their wealth. The Citrini Report led to some fairly elaborate Twitter c

## Quantum Computing will Augment Artificial Intelligence
- **Source**: substack (substack_ai)
- **URL**: https://www.ai-supremacy.com/p/quantum-computing-will-augment-artificial-intelligence-2026
- **Date**: 2026-02-23T02:32:18+00:00
- **Metadata**: {"publication": "ai_supremacy", "author": "Michael Spencer", "has_full_content": true}

### Content
Image: MIT Sloan Good Morning Recently with the Anthropic push back against the U.S. DoD (&#8220;Department of War&#8221;) issue, a group of quantum scientists have independently published a manifesto rejecting the use of quantum research for military purpose s and is seeking signatures from researchers around the world. Read the manifesto . You want to talk about emerging technology? The worlds of National defense, Generative AI, Geopolitics, Robotics Innovation (including things like space-tech &amp; drone swarms) and Quantum computing are quickly converging. Quantum computing is still in its nascent emerging beginnings. But it&#8217;s slowly becoming a field worth following with potential major intersections with AI, hybrid quantum chips, and very specialized accelerators for very narrow tasks related to scientific frontiers like chemistry, new materials, battery tech, cybersecurity and national defense capabilities, among others. The Three Core Pillars of Quantum The three rapidly (Q3) emerging pillars of Quantum technology and quantum computing broadly are as I see them are quantum computing, quantum communication, and quantum sensing that could together generate up to $97 billion in revenue worldwide by 2035. This could be around $200 Bn. by 2040 . Quantum Computing Quantum Communication Quantum Sensing I&#8217;ve always considered Quantum computing a wild card in how AI Supremacy plays out. I&#8217;ve been covering Quantum computing startups, fundraising and the industry for years on my Quantum Foundry Newsletter. When we finally are able to have real machines with millions of qubits (far from today&#8217;s reality), it will vastly opens up new possibilities for computing. It&#8217;s going to be a journey to get there. Quantum computing will lend aspects of parallelism that could radically augment AI. Even in terms of Quantum machine learning at the intersection of LLMs, if you think about it, thanks to superposition, a quantum computer can evaluate millions 

## Free Claude Max for (large project) open source maintainers
- **Source**: blog (researcher_blogs)
- **URL**: https://simonwillison.net/2026/Feb/27/claude-max-oss-six-months/#atom-everything
- **Date**: 2026-02-27T10:08:22+00:00
- **Metadata**: {"blog": "simon_willison", "author": ""}

### Content
Free Claude Max for (large project) open source maintainers Anthropic are now offering their $200/month Claude Max 20x plan for free to open source maintainers... for six months... and you have to meet the following criteria: Maintainers: You're a primary maintainer or core team member of a public repo with 5,000+ GitHub stars or 1M+ monthly NPM downloads. You've made commits, releases, or PR reviews within the last 3 months. Don't quite fit the criteria If you maintain something the ecosystem quietly depends on, apply anyway and tell us about it. Also in the small print: "Applications are reviewed on a rolling basis. We accept up to 10,000 contributors". Via Hacker News Tags: open-source , ai , generative-ai , llms , anthropic , claude

## I vibe coded my dream macOS presentation app
- **Source**: blog (researcher_blogs)
- **URL**: https://simonwillison.net/2026/Feb/25/present/#atom-everything
- **Date**: 2026-02-25T08:46:19+00:00
- **Metadata**: {"blog": "simon_willison", "author": ""}

### Content
I gave a talk this weekend at Social Science FOO Camp in Mountain View. The event was a classic unconference format where anyone could present a talk without needing to propose it in advance. I grabbed a slot for a talk I titled "The State of LLMs, February 2026 edition", subtitle "It's all changed since November!". I vibe coded a custom macOS app for the presentation the night before. I've written about the last twelve months of development in LLMs in December 2023 , December 2024 and December 2025 . I also presented The last six months in LLMs, illustrated by pelicans on bicycles at the AI Engineer World’s Fair in June 2025. This was my first time dropping the time covered to just three months, which neatly illustrates how much the space keeps accelerating and felt appropriate given the November 2025 inflection point . (I further illustrated this acceleration by wearing a Gemini 3 sweater to the talk, which I was given a couple of weeks ago and is already out-of-date thanks to Gemini 3.1 .) I always like to have at least one gimmick in any talk I give, based on the STAR moment principle I learned at Stanford - include Something They'll Always Remember to try and help your talk stand out. For this talk I had two gimmicks. I built the first part of the talk around coding agent assisted data analysis of Kākāpō breeding season (which meant I got to show off my mug ), then did a quick tour of some new pelicans riding bicycles before ending with the reveal that the entire presentation had been presented using a new macOS app I had vibe coded in ~45 minutes the night before the talk. Present.app The app is called Present - literally the first name I thought of. It's built using Swift and SwiftUI and weighs in at 355KB, or 76KB compressed . Swift apps are tiny! It may have been quick to build but the combined set of features is something I've wanted for years . I usually use Keynote for presentations, but sometimes I like to mix things up by presenting using a sequence of

## The Claude C Compiler: What It Reveals About the Future of Software
- **Source**: blog (researcher_blogs)
- **URL**: https://simonwillison.net/2026/Feb/22/ccc/#atom-everything
- **Date**: 2026-02-22T15:58:43+00:00
- **Metadata**: {"blog": "simon_willison", "author": ""}

### Content
The Claude C Compiler: What It Reveals About the Future of Software On February 5th Anthropic's Nicholas Carlini wrote about a project to use parallel Claudes to build a C compiler on top of the brand new Opus 4.6 Chris Lattner (Swift, LLVM, Clang, Mojo) knows more about C compilers than most. He just published this review of the code. Some points that stood out to me: Good software depends on judgment, communication, and clear abstraction. AI has amplified this. AI coding is automation of implementation, so design and stewardship become more important. Manual rewrites and translation work are becoming AI-native tasks, automating a large category of engineering effort. Chris is generally impressed with CCC (the Claude C Compiler): Taken together, CCC looks less like an experimental research compiler and more like a competent textbook implementation, the sort of system a strong undergraduate team might build early in a project before years of refinement. That alone is remarkable. It's a long way from being a production-ready compiler though: Several design choices suggest optimization toward passing tests rather than building general abstractions like a human would. [...] These flaws are informative rather than surprising, suggesting that current AI systems excel at assembling known techniques and optimizing toward measurable success criteria, while struggling with the open-ended generalization required for production-quality systems. The project also leads to deep open questions about how agentic engineering interacts with licensing and IP for both open source and proprietary code: If AI systems trained on decades of publicly available code can reproduce familiar structures, patterns, and even specific implementations, where exactly is the boundary between learning and copying? Tags: c , compilers , open-source , ai , ai-assisted-programming , anthropic , claude , nicholas-carlini , coding-agents , agentic-engineering

## How I think about Codex
- **Source**: blog (researcher_blogs)
- **URL**: https://simonwillison.net/2026/Feb/22/how-i-think-about-codex/#atom-everything
- **Date**: 2026-02-22T07:53:43+00:00
- **Metadata**: {"blog": "simon_willison", "author": ""}

### Content
How I think about Codex Gabriel Chua (Developer Experience Engineer for APAC at OpenAI) provides his take on the confusing terminology behind the term "Codex", which can refer to a bunch of of different things within the OpenAI ecosystem: In plain terms, Codex is OpenAI’s software engineering agent, available through multiple interfaces, and an agent is a model plus instructions and tools, wrapped in a runtime that can execute tasks on your behalf. [...] At a high level, I see Codex as three parts working together: Codex = Model + Harness + Surfaces [...] Model + Harness = the Agent Surfaces = how you interact with the Agent He defines the harness as "the collection of instructions and tools", which is notably open source and lives in the openai/codex repository. Gabriel also provides the first acknowledgment I've seen from an OpenAI insider that the Codex model family are directly trained for the Codex harness: Codex models are trained in the presence of the harness. Tool use, execution loops, compaction, and iterative verification aren’t bolted on behaviors — they’re part of how the model learns to operate. The harness, in turn, is shaped around how the model plans, invokes tools, and recovers from failure. Tags: definitions , openai , generative-ai , llms , ai-assisted-programming , codex-cli

## Mixture of Experts (MoEs) in Transformers
- **Source**: blog (researcher_blogs)
- **URL**: https://huggingface.co/blog/moe-transformers
- **Date**: 2026-02-25T16:00:00+00:00
- **Metadata**: {"blog": "huggingface", "author": ""}

### Content
Mixture of Experts (MoEs) in Transformers
Introduction
Over the past few years, scaling dense language models has driven most progress in LLMs. From early models like the original ULMFiT (~30M parameters) or GPT-2 (1.5B parameters, which at the time was considered "too dangerous to release" 🧌), and eventually to today’s hundred-billion–parameter systems, the recipe was simple:
More data + more parameters gives better performance.
Scaling laws reinforced this trend, but dense scaling has practical limits:
- Training becomes increasingly expensive.
- Inference latency grows.
- Deployment requires significant memory and hardware.
This is where Mixture of Experts (MoEs) enter the picture.
If you're already familiar with MoEs and want to jump straight into the engineering work done in transformers, you can head directly to Transformers and MoEs.
From Dense to Sparse: What Are MoEs?
A Mixture of Experts model keeps the Transformer backbone, but replaces certain dense feed-forward layers with a set of experts. An “expert” is not a topic-specialized module (e.g., "math expert", "code expert"). It is simply a learnable sub-network. For each token, a router selects a small subset of experts to process it.
| Figure 1: Expert 1 among 4 experts is activated (Source: Maarten Grootendorst) |
Different tokens activate different experts, based on their hidden representations.
Model capacity depends on total parameters, but inference speed depends on active parameters.
This is the key idea.
For example, take gpt-oss-20b
. It has 21B total parameters, but uses 4 active experts per token, out of a total of 32 experts. Considering the shared components plus the active experts, this model uses ~3.6B active parameters per token. Running this model on an M3 Ultra Mac, which has a memory bandwidth of about 800 GB, we could estimate generation speed as ~ 800 / (3.6 * 2)
in bfloat16
, where each parameter takes 2 bytes. This yields about 111 tokens per second. The actual performance number we

## Deploying Open Source Vision Language Models (VLM) on Jetson
- **Source**: blog (researcher_blogs)
- **URL**: https://huggingface.co/blog/nvidia/cosmos-on-jetson
- **Date**: 2026-02-23T16:00:21+00:00
- **Metadata**: {"blog": "huggingface", "author": ""}

### Content
Deploying Open Source Vision Language Models (VLM) on Jetson
Vision-Language Models (VLMs) mark a significant leap in AI by blending visual perception with semantic reasoning. Moving beyond traditional models constrained by fixed labels, VLMs utilize a joint embedding space to interpret and discuss complex, open-ended environments using natural language.
The rapid evolution of reasoning accuracy and efficiency has made these models ideal for edge devices. The NVIDIA Jetson family, ranging from the high-performance AGX Thor and AGX Orin to the compact Orin Nano Super is purpose-built to drive accelerated applications for physical AI and robotics, providing the optimized runtime necessary for leading open source models.
In this tutorial, we will demonstrate how to deploy the NVIDIA Cosmos Reason 2B model across the Jetson lineup using the vLLM framework. We will also guide you through connecting this model to the Live VLM WebUI, enabling a real-time, webcam-based interface for interactive physical AI.
Prerequisites
Supported Devices:
- Jetson AGX Thor Developer Kit
- Jetson AGX Orin (64GB / 32GB)
- Jetson Orin Super Nano
JetPack Version:
- JetPack 6 (L4T r36.x) — for Orin devices
- JetPack 7 (L4T r38.x) — for Thor
Storage: NVMe SSD required
- ~5 GB for the FP8 model weights
- ~8 GB for the vLLM container image
Accounts:
- Create NVIDIA NGC account(free) to download both the model and vLLM contanier
Overview
| Jetson AGX Thor | Jetson AGX Orin | Orin Super Nano | |
|---|---|---|---|
| vLLM Container | nvcr.io/nvidia/vllm:26.01-py3 |
ghcr.io/nvidia-ai-iot/vllm:r36.4-tegra-aarch64-cu126-22.04 |
ghcr.io/nvidia-ai-iot/vllm:r36.4-tegra-aarch64-cu126-22.04 |
| Model | FP8 via NGC (volume mount) | FP8 via NGC (volume mount) | FP8 via NGC (volume mount) |
| Max Model Length | 8192 tokens | 8192 tokens | 256 tokens (memory-constrained) |
| GPU Memory Util | 0.8 | 0.8 | 0.65 |
The workflow is the same for both devices:
- Download the FP8 model checkpoint via NGC CLI
- Pull the v

## Enhancing Multimodal Training and Memory Efficiency with DeepSpeed
- **Source**: blog (researcher_blogs)
- **URL**: https://pytorch.org/blog/enhancing-multimodal-training-and-memory-efficiency-with-deepspeed/
- **Date**: 2026-02-24T16:45:25+00:00
- **Metadata**: {"blog": "pytorch", "author": "Masahiro Tanaka (Anyscale) and Olatunji Ruwase (Snowflake)"}

### Content
Overview This blog walks through two crucial DeepSpeed updates: (1) a PyTorch-identical backward API that enables efficient training of multimodal, multi-component models (including non-scalar backward calls), and (2) low-precision model training that significantly reduces peak memory, especially. For multimodal workloads, like combining a vision encoder with an LLM, training loops can become complex and multi-component. The first update introduces a PyTorch-identical backward API that makes writing such loops straightforward, enabling sophisticated parallelism schemes with simple, clean code, while DeepSpeed transparently manages various performance optimizations. As one example, the flexibility of the API enabled disaggregated hybrid parallelism , achieving a 30% speedup for multimodal AI model training while making model development with DeepSpeed feel closer to &#8220;vanilla PyTorch&#8221;. Meanwhile, for LLM fine-tuning, a new option to keep all model states (parameters, gradients, and optimizer states) in lower-precision, such as BF16 or FP16, drastically reduces the memory footprint, allowing researchers to train larger models on more constrained hardware. Low-precision training is highly beneficial across a wide range of applications, including supervised fine-tuning (SFT), reinforcement learning (RL), and multimodal training. Our experiment showed 40% peak memory reduction while keeping numerical stability ( benchmarking script ). The numerical stability is achieved through integration with torch.autocast, which ensures the quality of the model is maintained. The remainder of this blog will elaborate on how these updates directly facilitate the development of cutting-edge training workloads. 1. PyTorch-identical backward API DeepSpeed now supports PyTorch&#8217;s native backward() syntax while preserving all its optimizations. Traditionally, DeepSpeed’s training loop relied on the engine’s backward API: loss = model_engine(batch) model_engine.backward(loss

## Google Releases Gemini 3.1 Pro In Preview, Tops Intelligence Index at Same Price
- **Source**: exa (exa_newsletters)
- **URL**: https://www.deeplearning.ai/the-batch/google-releases-gemini-3-1-pro-in-preview-tops-intelligence-index-at-same-price/
- **Date**: 2026-02-27T00:00:00+00:00
- **Metadata**: {"author": "", "exa_id": "https://www.deeplearning.ai/the-batch/google-releases-gemini-3-1-pro-in-preview-tops-intelligence-index-at-same-price/"}

### Snippet
Gemini Takes the Lead Google releases Gemini 3.1 Pro in preview, tops Intelligence Index at same price
 Machine Learning Research
 
Large Multimodal Models (LMMs)
 
Published
 
Feb 27, 2026
 Reading time
3 min read
Share
* 
* 
* Loading the Elevenlabs Text to Speech AudioNative Player... Google updated its flagship Gemini model, topping several benchmarks while undercutting competitors on performance per dollar. **What’s new:**Google launched Gemini 3.1 Pro Preview at the same price as its predecessor Gemini 3 Pro Preview. Gemini 3.1 Pro Preview is the basis ofrecent performance gains by Gemini 3 Deep Think , a specialized reasoning mode separate from the three reasoning levels available via API. * **Input/output:**Text, images, PDFs, audio, video in (up to 1 million tokens), text out (up to 64,000 tokens, 108.6 ... * **Architecture:**Mixture-of-experts transformer * **Features:**Tool use (Google search, Python code execution, file search, function calling), structured outputs, ... * **Performance:**Gemini 3.1 Pro Preview with reasoning (level unspecified) topped Artificial Analysis Intelligence Index; achieved state of the art on ARC-AGI-2, GPQA Diamond, Humanity’s Last Exam, MCP Atlas, BrowseComp, Terminal-Bench 2.0, MathArena Apex, MMLU-Pro ... services Google AI Studio, Vertex AI, Gemini CLI, and third-party tools including Microsoft Visual Studio and GitHub CoPilot; API $2/$0.20/$12 per million input/cached/output tokens for input contexts under 200,000 tokens, $4/$0.40/$18 per million input/cached/output tokens for input contexts greater than 200,000 tokens (plus $4.50 per ... * **Knowledge cutoff:**January 2025
* **Undisclosed:**Parameter count, architecture details, training methods **How it works:**Google disclosed few details about Gemini 3.1 Pro Preview. The model is a sparse mixture-of-experts transformer pretrained on text, code, images, audio, and video scraped from the web alongside licensed materials, Google user data, and synthetic data. It was fine-tuned via reinforcement learning on datasets that covered multi-step ... * On the Artificial Analysis Intelligence Index , a weighted average of 10 benchmarks that focus on economically useful work, Gemini 3.1 Pro Preview with reasoning (57 points at a cost of $892) outperformed Claude Opus 4.6 set to max reasoning (53 points, $2,486), GPT-5.2 set to xhigh reasoning (51 points, $2,304), and the open-weights GLM-5 (50 points, $547). It led six of the index’s 10 component benchmarks. * However, Gemini 3.1 Pro Preview (reasoning unspecified) placed seventh in coding on Arena , which ranks ... **Why it matters:**Gemini 3.1 Pro’s gains appear to stem more from improved model quality than additional computation ... tokens as its predecessor, yet it scored significantly higher. This suggests that refining models can still yield ... **We’re thinking:**On ARC-AGI-2, the performance of Gemini-3.1 Pro Preview — presumably set to high reasoning —is less than 10 percent shy of Gemini 3.1 Deep Think’s (77 percent versus 85 percent) but 13 timesless expensive ($0.96 per ... 
 
## Subscribe to The Batch
Stay updated with weekly AI News and Insights

## February update: Accelerating adaptation and enabling trust between LLMs
- **Source**: exa (exa_newsletters)
- **URL**: https://ariaresearch.substack.com/p/february-update-accelerating-adaptation
- **Date**: 2026-02-27T00:00:00+00:00
- **Metadata**: {"author": "ARIA", "exa_id": "https://ariaresearch.substack.com/p/february-update-accelerating-adaptation"}

### Snippet
, 2026
9
Share
## What’s new at ARIA * We’ve committed £50m to create the Scaling Inference Lab – an AI testbed within our Scaling Compute programme designed to prioritise rapid iteration, open collaboration, and long-term sustainability. Find out more and express your interest for future participation and read more about the Scaling Inference Lab in Post ... * Discover funding across our new programmes: * Accelerated Adaptation is exploring pathways to accelerate the adaptation of wild species to prevent biodiversity ... submit a concept paper by 6 March . * Universal Fabricators seeks to harness proteins to produce a functionally universal range of materials at scale. ... * Massively Scalable Neurotechnologies aims to develop a new class of neurotechnologies that reach and interact with ... March.] * Scaling Trust is focused on enabling AI agents to securely coordinate, negotiate, and verify with one another on our behalf. Learn more and apply for funding by 24 March . * Full proposals are also now open for Enduring Atmospheric Platforms. Help us to unlock a digital infrastructure layer between the Earth and space – apply for funding by 2 April . * We’ve published a concept note for our next Activation Partner (AP) cohort. [Dive in and share your ... * Become an Encode: AI for Science Fellow and spend a year with the freedom to build what matters. Starting in ... * Venture Café London: Scale Smarter (5 March), Creative Catalyst (12 March), [Launching Bind ... * Venture Café Edinburgh: Scotland’s Next Economy (12 March) * Venture Café Manchester: AI Social Club (5 March), AI + Automation (19 March) ... 
 
 
## Expanding the Conservation Toolkit *Earlier this month we launched the Accelerated Adaptation programme, backed by £54m. With concept papers now open, ... are highly complex, and I (like many others) have been frustrated by the hubris of those who have underestimated the ... ARIA-scale programmes could focus on better measuring living organisms, or better data modelling and integration. But ... At the heart of this change is my belief that the balance of risks has shifted. Over recent decades, risks of ... ] *Human-driven environmental pressures, from the movement of species and pathogens to places they have never ... The risks of intervention remain real, but the risks of maintaining the status quo have grown larger still. The ... Building a new set of tools that can complement and augment well-established conservation approaches could provide the ... We can already see the direction of consensus beginning to shift. Most notably, the International Union for the ... But what should breakthrough tools that could complement existing nature protection approaches look like? What we’re proposing with the £54m Accelerated Adaptation programme is not a single technology or an unquestioning ... ARIA’s mission is to unlock scientific and technological breakthroughs that could transform human productivity and wellbeing. But scientific breakthroughs alone are not enough. Our Activation Partner work is designed to create the right conditions for these breakthroughs to be translated into world-changing capabilities. A year into working with our Activation Partners, ARIA Product Manager Pranay Shah reflects on what we’ve learned from ... retrospective] . We’ve also published a concept note for a second call for Activation Partners. Building on the early progress of the ... We’re also expanding the scope of Activation Partners to apply advanced AI capabilities to R&D, building on insights from our AI Scientists initiative. Share feedback on our concept note . ... ## Benchmarking automated mechanism design: A Q&A with Samuele Marro To help us shape the development of our Scaling Trust programme, we funded a series of short, exploratory research projects, ranging from exploring aspects of Arena design to diving into topics around physical trust and AI security theory. One of these projects was led by Samuele Marro and his team, who

## The State Of LLMs 2025: Progress, Problems, and Predictions
- **Source**: exa (exa_newsletters)
- **URL**: https://sebastianraschka.substack.com/p/state-of-llms-2025
- **Date**: 2026-02-28T17:15:18.861577+00:00
- **Metadata**: {"author": "Sebastian Raschka, PhD", "exa_id": "https://sebastianraschka.substack.com/p/state-of-llms-2025"}

### Snippet
The State Of LLMs 2025: Progress, Problems, and Predictions 
 Sebastian Raschka, PhD's avatar 
 
 Sebastian Raschka, PhD 
Dec 30, 2025
502
40
55 Share As 2025 comes to a close, I want to look back at some of the year’s most important developments in large language models, reflect on the limitations and open problems that remain, and share a few thoughts on what might come next. As I tend to say every year, 2025 was a very eventful year for LLMs and AI, and this year, there was no sign of ... # 1. The Year of Reasoning, RLVR, and GRPO There are many interesting topics I want to cover, but let’s start chronologically in January 2025. ​Scaling still worked, but it didn’t really change how LLMs behaved or felt in practice (the only exception to that was OpenAI’s freshly released o1, which added reasoning traces). So, when DeepSeek released their R1 paper in ... big deal. (Reasoning, in the context of LLMs, means that the model explains its answer, and this explanation itself ... Third, and most interestingly, the paper presented *Reinforcement Learning with Verifiable Rewards* (RLVR) with the GRPO algorithm as a new (or at least modified) algorithmic approach for developing so-called reasoning models and ... ] *Figure 4: Broad overview of how / when reinforcement learning is applied. There are many details that I am ... What’s so important about DeepSeek R1 and RLVR is that they allow us to post-train LLMs on large amounts of data, which ... Read full story
] 
] ​All that being said, the takeaway is that LLM development this year was essentially dominated by reasoning models using RLVR and GRPO. ​Essentially, every major open-weight or proprietary LLM developer has released a reasoning (often called “thinking”) variant of their model following DeepSeek R1. ## **1.2 LLM Focus Points** If I were to summarize the LLM development focus points succinctly for each year, beyond just scaling the architecture and pre-training compute, my list would look like this: * **2022 RLHF + PPO**
* **2023 LoRA SFT**
* **2024 Mid-Training**
* **2025 RLVR + GRPO** Pre-training is still the required foundation for everything. Besides that, RLHF (via the PPO algorithm) was, of ... In 2023, there was a lot of focus on LoRA and LoRA-like parameter-efficient fine-tuning techniques to train small ... Then, in 2024, all major labs began making their (pre-)training pipelines more sophisticated by focusing on synthetic ... So, if you asked me today what I see on the horizon for 2026 and 2027, I’d say the following: ... Besides the aforementioned RLVR extensions, I think there will be more focus on inference-time scaling in 2026. Inference-time scaling means we spend more time and money after training when we let the LLM generate the answer, but ... In recent years, popular examples include LoRA ( LoRA: Low-Rank Adaptation of Large Language Models 2021) ... In my bubble, this year’s research highlight has been GRPO. Although it was introduced in the DeepSeek R1 paper rather ... # 3. LLM Architectures: A Fork in the Road? When it comes to LLM architectures, state-of-the-art models still use the good old decoder-style transformer. However, this year, open-weight LLMs more or less converged on using mixture-of-experts (MoE) layers, as well as at least one ... # 4. It’s Also The Year of Inference-Scaling and Tool Use Improving LLMs by scaling training data and architectures is an established formula that (still) keeps on giving. However, especially this year, it’s no longer the “only” sufficient recipe. ​We saw this with GPT 4.5 (Feb 2025), which was rumored to be much larger than GPT 4 (and the later-released GPT 5), and pure scaling alone is not generally the most sensible way forward. The capabilities of GPT 4.5 may have been better ... Instead, better training pipelines (with greater focus on mid- and post-training) and inference scaling have driven ... If I had to pick a word or trend that describes LLM development this year, it would be “benchmaxxing”. ​Here,

## A knockout blow for LLMs? - Marcus on AI - Substack
- **Source**: exa (exa_newsletters)
- **URL**: https://garymarcus.substack.com/p/a-knockout-blow-for-llms
- **Date**: 2026-02-28T17:15:18.861603+00:00
- **Metadata**: {"author": "Gary Marcus", "exa_id": "https://garymarcus.substack.com/p/a-knockout-blow-for-llms"}

### Snippet
Jun 07, 2025
1,411
254
235
Share ... Ha ha ha. But What’s the fuss about? Apple has a new paper ; it’s pretty devastating to LLMs, a powerful followup to one from many of the same authors last year . There’s actually an interesting weakness in the new argument—which I will get to below—but the overall force of the argument is undeniably powerful. So much so that LLM advocates are already partly conceding the blow while hinting at, ... On the one hand, it echoes and amplifies the training distribution argument that I have been making since 1998: neural networks of various kinds can generalize *within a training distribution of data they are exposed to, but their generalizations tend to break down outside that distribution. *That was the crux of my 1998 paper skewering multilayer ... seven-month-old infants could extrapolate in a way that then-standard neural networks could not ). It was also the central motivation of my 2018 Deep Learning: Critical Appraisal , and my 2022 [Deep Learning is ... “reasoning models” are the latest generation of attempts to rescue the inherent limitations of LLMs, by forcing them to ... here , with followup work here . The new Apple paper adds to the force of Rao’s critique (and my own) by showing that even the latest of these ... on a whole bunch of classic problems, like the Tower of Hanoi . For anyone hoping that “reasoning” or “inference time compute” would get LLMs back on track, and take away the pain of m mutiple failures at getting pure ... Hanoi is a classic game with three pegs and multiple discs in which you need to move all the discs on the left peg to ... Apple found that the widely praised o3-min (high) was no better (see accuracy, top left panel, legend at bottom), and ... shouldn’t have the same excuse. § What the Apple paper shows, most fundamentally, regardless of how you define AGI, is that LLMs are no substitute for good well-specified conventional algorithms. (They also can’t play chess as well as conventional algorithms, can’t fold proteins like special-purpose neurosymbolic hybrids, can’t run databases as well as conventional databases, etc.) In the best case (not always reached) they can write python code, supplementing their own weaknesses with outside symbolic code, but even this is not reliable. What this means for business and society is that you can’t simply drop o3 ... Worse, as the latest Apple papers shows, LLMs may well work on your easy test set (like Hanoi with 4 discs) and seduce you into thinking it has built a proper, generalizable solution when it does not. At least for the next decade, LLMs (with and without inference time “reasoning”) will continue have their uses, especially for coding and brainstorming and writing. And as Rao told me in a message this morning, “the fact that LLMs/LRMs don't reliably learn any single underlying algorithm is not a complete deal killer on their use. I think of LRMs basically making learning to approximate the unfolding of an algorithm over increasing inference lengths .” In some contexts that will be perfectly fine (in others not so much). But anybody who thinks LLMs are a direct route to the sort AGI that could fundamentally transform society for the good is kidding themselves. This does not mean that the field of neural networks is dead, or that deep learning is dead. LLMs are just one form of deep learning, and maybe others — especially those that play nicer with symbols – will eventually thrive. Time will tell. But this particular approach has limits that are clearer by the day. §
I have said it before, and I will say it again:
 
 
 ... LLMs amaze at what they can do, LLMs amaze at what they can't do. The dichotomy is as fascinating as it is frustrating. Reply
Share
 17 replies 
 
 Yaxiong Zhao's avatar 
 
 Yaxiong Zhao ... Thanks for the through review of relevant works up to this point. I very much share your opinion. The paper is an elegant scientific research, which the computer science community unfortunately have

## LLMs and Beyond: All Roads Lead to Latent Space - AI Prospects
- **Source**: exa (exa_newsletters)
- **URL**: https://aiprospects.substack.com/p/llms-and-beyond-all-roads-lead-to
- **Date**: 2026-02-28T17:15:18.861604+00:00
- **Metadata**: {"author": "Eric Drexler", "exa_id": "https://aiprospects.substack.com/p/llms-and-beyond-all-roads-lead-to"}

### Snippet
LLMs and Beyond: All Roads Lead to Latent Space ### Essential concepts for understanding AI today and prospects for tomorrow. (Bonus footnotes: the maths of exponential orthogonality & updated citations 30 May 2025) 
 Eric Drexler's avatar 
 
 Eric Drexler 
Apr 14, 2025
Share
(Updated 28 June 2025) Today's AI technologies are based on deep learning, 1 yet “AI” is commonly equated with large language models, 2 and the fundamental nature of deep learning and LLMs is obscured by talk of using “statistical patterns” to “predict tokens”. This token-focused framing has been a remarkably effective way to misunderstand AI. The key concept to grasp is “latent space” (not statistics, or tokens, or algorithms). It’s representation and ... In machine learning (≈ deep learning ≈ neural networks ≈ “AI”), latent-space related terminology is rich in synonyms, ... AI is much more than just LLMs, 4 but it’s difficult to grasp what AI is about without having at least a ... Are LLMs systems *programmed* to *predict the next token* based on *statistical patterns* in training data? This common ... that can be clearly distinguished in a 4096-dimensional space (as used in Meta's Llama models) *far* exceeds the number ... Understanding latent space representation in LLMs provides a foundation for grasping how modern AI works more broadly, ... Deep learning has quietly transformed domains beyond language. In every area, systems use latent space representations, ... Latent space representations enable multimodal systems to bridge different forms of information. Systems like CLIP map ... implementation capacity] . The implications of this kind of integration challenge incremental projections of AI progress. Incremental improvements ... crucial for anticipating future AI developments. ... Prospective ** Large Knowledge Models ** (LKMs) improve on text-based RAG by representing knowledge directly ... both known and yet to be invented. ## All roads lead to latent space
Latent-space processing is the foundation and future of AI. * LLMs and other modern AI systems ***process latent-space representations**,* not tokens or pixels or statistical data. * Multimodal AI systems process and integrate information through latent-space representations that ***abstract meaning from modality**.* * Scalable knowledge models will produce, store, and refine* **world knowledge in latent-space representations**,* providing a foundation for increasingly general AI capabilities. To understand AI prospects we must think in these terms, looking beyond surface capabilities to the mechanisms that ... Understanding AI through the lens of latent space has broad implications. For researchers, it favors shifting focus toward latent space representation quality and cross-modal integration. For developers, it highlights opportunities to ... policymakers and strategists, it suggests that AI capabilities will grow not just through larger models, but through ... swiftly than linear projections would suggest. For AI today and tomorrow, all roads lead to latent space.
 
 
 
Subscribe
 1 Deep learning's power comes from differentiable representations and processing — the ability to learn billions of parameters through trillions of small tweaks during training. The older, non-differentiable, symbol-processing approaches to AI provide no similar mechanism for learning. Don’t confuse AI-then with AI-now: They have little in ... 2 Which (after data curation, fine tuning, and reinforcement learning) are no longer “language models” . ... Note that “embedding” typically denotes a *persistent* latent-space representation, not a transient neural activation, ... 10 Overall, LLMs

## LLM Race; War of the Frontier Model Makers, Azure & AI; "Vibe ...
- **Source**: exa (exa_newsletters)
- **URL**: https://agenticmsp.substack.com/p/llm-race-war-of-the-frontier-model
- **Date**: 2026-02-28T17:15:18.861606+00:00
- **Metadata**: {"author": "Howard M Cohen", "exa_id": "https://agenticmsp.substack.com/p/llm-race-war-of-the-frontier-model"}

### Snippet
LLM Race; War of the Frontier Model Makers, Azure & AI; "Vibe Coding is coding"; Fearing the ... ### The AI and AI Agent information, insight, and guidance MSPs are seeking all in one place from one very senior ... 
 Howard M Cohen's avatar 
 
 Howard M Cohen 
Feb 06, 2026
2
Share **Email Recipients Please Note:**This is an extra-long edition of Agentic MSP so your email may be cut off at the end. ... Across the next three issues of Agentic MSP, I’ll profile the three recognized “Godfathers of AI”, Geoffrey Hinton, Yoshua Bengio, and Yann LeCun. * Geoffrey Hinton is credited with key advances in neural networks and the popularization of backpropagation, which ... 
 
 **The Race of the Large Language Models**continued this past week with Anthropic releasing Claude Opus 4.6 closely on the heels of OpenAI delivering ChatGPT 5.3 Codex, along with the introduction of Frontier, their new platform for agent management. Super Bowl LX will bring us the first salvo in the growing**War between OpenAI and Anthropic**. The players are ... Frontier Model Makers conduct their competition. **The Intertwining of Azure and AI**gets tighter and tighter with AI generating more than a quarter of Azure’s income last year and poised to double that in 2026. **Coding, Vibe Coding, and More**: What can you actually do with Claude Code, a question you’ll be asking because soon you’ll be needing to choose your tools. The Rise of Software Written by Software **Fearing the SaaSpocolypse?**Nvidia’s Jensen Huang Defends Software Sector Amid AI Disruption Fears.
[
 ... **HMC:**If Anthropic is following the classic release numbering standard of version.revision, then Claude Opus 4.6 just ... **Summary**: Anthropic has released Claude Opus 4.6, a significant update moving beyond chat to autonomous enterprise ... # OpenAI Launches GPT-5.3-Codex
 
 
 **HMC**: We’ll cover the war of the coders, and choosing your console, later in this issue, but clearly OpenAI knows it ... **Summary:**A specialized iteration of the GPT-5 model, GPT-5.3-Codex, has been released for paid plans. It is ... 
] 
# OpenAI Debuts “Frontier” for Enterprise Agent Deployment
 
 
 **HMC:**It’s all about transforming code into coworkers. With the introduction of protocols like MCP and A2A its clear ... **Summary:**OpenAI has launched “Frontier,” a new platform designed specifically for deploying and managing autonomous ... **Executive Summary:**OpenAI and Anthropic released competing AI models on the same day (February 5, 2026)—GPT-5.3-Codex and Claude Opus 4.6 respectively—marking an unprecedented escalation in their rivalry. The conflict ... # MICROSOFT AZURE - AI Cloud Partner Program Expansion - February 2026
 
 
 **HMC**: With AI services delivering 26% of Azure’s income last year, expected to double this year, AI has clearly become the tip of the Azure spear. Those who have been long-time Microsoft partners will be accustomed to Microsoft’s ... **Summary:**Microsoft announced expansion of its AI Cloud Partner Program benefits packages in February 2026, signaling ... **Source: https://www.ainvest.com/news/microsoft-2026-growth-engine-scaling-azure-ai-ecosystem-2601/ **
 
 
# “Vibe Coding” & The Rise of Software Written by Software
[
 ... **HMC:**We just celebrated the one year anniversary of the day Andrej Karpathy coined the term “vibe coding” and we’ve been arguing about it ever since. The source for this news item declares that “vibe coding is coding, period” and I ... **Summary**: NVIDIA CEO Jensen Huang and others are highlighting “Vibe coding” and tools like Claude Code, predicting that the majority of the world’s software will soon be written by AI. Reports indicate a shift where
