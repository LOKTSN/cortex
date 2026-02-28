# Raw Sources — The Batch - Issue 342

## Don't trust AI agents
- **Source**: hackernews (hn)
- **URL**: https://nanoclaw.dev/blog/nanoclaw-security-model
- **Date**: 2026-02-28T12:39:32+00:00
- **Metadata**: {"points": 212, "comments": 108, "author": "gronky_", "hn_id": "47194611"}

### Content
Don't trust AI agents
February 28, 2026 · Gavriel Cohen
When you’re building with AI agents, they should be treated as untrusted and potentially malicious. Whether you’re worried about prompt injection, a model trying to escape its sandbox, or something nobody’s thought of yet, regardless of what your threat model is, you shouldn’t be trusting the agent. The right approach isn’t better permission checks or smarter allowlists. It’s architecture that assumes agents will misbehave and contains the damage when they do.
That’s the principle I built NanoClaw on.
Don’t trust the process
OpenClaw runs directly on the host machine by default. It has an opt-in Docker sandbox mode, but it’s turned off out of the box, and most users never turn it on. Without it, security relies entirely on application-level checks: allowlists, confirmation prompts, a set of “safe” commands. These checks come from a place of implicit trust that the agent isn’t going to try to do something wrong. Once you adopt the mindset that an agent is potentially malicious, it’s obvious that application-level blocks aren’t enough. They don’t provide hermetic security. A determined or compromised agent can find ways around them.
In NanoClaw, container isolation is a core part of the architecture. Each agent runs in its own container, on Docker or an Apple Container on macOS. Containers are ephemeral, created fresh per invocation and destroyed afterward. The agent runs as an unprivileged user and can only see directories that have been explicitly mounted in. A container boundary is enforced by the OS.
Don’t trust other agents
Even when OpenClaw’s sandbox is enabled, all agents share the same container. You might have one agent as a personal assistant and another for work, in different WhatsApp groups or Telegram channels. They’re all in the same environment, which means information can leak between agents that are supposed to be accessing different data.
Agents shouldn’t trust each other any more than you trus

## What AI coding costs you
- **Source**: hackernews (hn)
- **URL**: https://tomwojcik.com/posts/2026-02-15/finding-the-right-amount-of-ai/
- **Date**: 2026-02-28T13:05:03+00:00
- **Metadata**: {"points": 142, "comments": 106, "author": "tomwojcik", "hn_id": "47194847"}

### Content
What AI coding costs you
Every developer I know uses AI for coding now. The productivity gains are real, but there are costs that don’t show up on any dashboard.
Imagine a spectrum. On the far left are humans typing on the keyboard, seeing the code in the IDE. On the far right: AGI. It implements everything on its own. Cheaply, flawlessly, better than any human, and no human overseer is required. Somewhere between those two extremes there’s you, using AI, today. That threshold moves to the right every week as models improve, tools mature, and workflows get refined.
Recently I stumbled upon this awesome daxfohl comment on HN:
Which is higher risk, using AI too much, or using AI too little?
and it made me think about LLMs for coding differently, especially after reading what other devs share on AI adoption in different workplaces. You can be wrong in both directions, but is the desired amount of AI usage at work changing as the models improve?
How We Got Here
Not long ago the first AI coding tools like Cursor (2023) or Copilot (2022) emerged. They were able to quickly index the codebase using RAG, so they had the local context. They had all the knowledge of the models powering them, so they had an external knowledge of the Internet as well. Googling and browsing StackOverflow wasn’t needed anymore. Cursor gave the users a custom IDE with built in AI powered autocomplete and other baked-in AI tools, like chat, to make the experience coherent.
Then came the agent promise. MCPs, autonomous workflows, articles about agents running overnight started to pop up left and right. It was a different use of AI than Cursor. It was no longer an AI-assisted human coding, but a human-assisted AI coding.
Many devs tried it and got burned. Agents made tons of small mistakes. The AI-first process required a complete paradigm shift in how devs think about coding, in order to achieve great results. Also, agents often got stuck in loops, hallucinate dependencies, and produced code that loo

## How much does distillation really matter for Chinese LLMs?
- **Source**: substack (substack_ai)
- **URL**: https://www.interconnects.ai/p/how-much-does-distillation-really
- **Date**: 2026-02-24T08:06:43+00:00
- **Metadata**: {"publication": "interconnects", "author": "Nathan Lambert", "has_full_content": true}

### Content
Distillation has been one of the most frequent topics of discussion in the broader US-China and technological diffusion story for AI. Distillation is a term with many definitions &#8212; the colloquial one today is using a stronger AI model&#8217;s outputs to teach a weaker model. The word itself is derived from a more technical and specific definition of knowledge distillation (Hinton, Vinyals, &amp; Dean 2015), which involves a specific way of learning to match the probability distribution of a teacher model. The distillation of today is better described generally as synthetic data. You take outputs from a stronger model, usually via an API, and you train your model to predict those. The technical form of knowledge distillation is not actually possible from API models because they don&#8217;t expose the right information to the user. Synthetic data is arguably the single most useful method that an AI researcher today uses to improve the models on a day to day basis. Yes, architecture is crucial, some data still needs exclusively human inputs, and new ideas like reinforcement learning with verifiable rewards at scale can transform the industry, but so much of the day to day life in improving models today is figuring out how to properly capture and scale up synthetic data. To flesh out the point from the start of this piece, the argument has repeatedly been that the leading Chinese labs are using distillation for their models to steal capabilities from the best American API-based counterparts. The most prominent case to date was surrounding the release of DeepSeek R1 &#8212; where OpenAI accused DeepSeek of stealing their reasoning traces by jailbreaking the API (they&#8217;re not exposed by default &#8212; for context, a reasoning trace is a colloquial word of art referring to the internal reasoning process, such as what open weight reasoning models expose to the user). Fear of distillation is also likely why Gemini quickly flipped from exposing the reasoning trace

## Reply guy
- **Source**: blog (researcher_blogs)
- **URL**: https://simonwillison.net/2026/Feb/23/reply-guy/#atom-everything
- **Date**: 2026-02-23T05:11:57+00:00
- **Metadata**: {"blog": "simon_willison", "author": ""}

### Content
The latest scourge of Twitter is AI bots that reply to your tweets with generic, banal commentary slop, often accompanied by a question to "drive engagement" and waste as much of your time as possible. I just found out that the category name for this genre of software is reply guy tools. Amazing. Tags: ai-ethics , twitter , slop , generative-ai , definitions , ai , llms

## Accelerating Autotuning in Helion with Bayesian Optimization
- **Source**: blog (researcher_blogs)
- **URL**: https://pytorch.org/blog/accelerating-autotuning-in-helion/
- **Date**: 2026-02-24T09:55:18+00:00
- **Metadata**: {"blog": "pytorch", "author": "Ethan Che, Oguz Ulgen, Max Balandat, Jongsok Choi, Jason Ansel"}

### Content
Introduction As introduced in a previous blog post , Helion is a high-level DSL that empowers developers to write high-performance ML kernels using a familiar PyTorch-like syntax, delegating the complex task of optimization to its autotuning engine. This autotuner explores a vast, high-dimensional space of implementation choices—block sizes, loop orders, memory access patterns—to discover configurations that maximize performance on the target hardware. As a result, Helion can achieve significant speedups over torch.compile and even highly-optimized, hand-written kernels in Triton or CuTe DSL. However, the performance gains from auto-tuning comes with a cost: long wall-clock times . A typical autotuning session can take 10+ minutes, evaluating thousands of candidate configurations, and can even take on the order of hours for complex kernels. Since its launch, long autotuning times have consistently surfaced as a user complaint and one of the biggest pain points in the kernel development cycle. While Helion provides developers options to shorten the auto-tuning process, e.g. by reducing the number of search steps, this typically leads to a loss in kernel performance, forcing an undesirable trade-off. In this blog post, we discuss our ongoing efforts to improve the autotuning experience. In particular, we discuss a new search algorithm LFBO Pattern Search we developed to address these issues, which employs techniques from machine learning (ML) to improve efficiency of the autotuning engine. The search algorithm trains an ML model to intelligently filter candidate configurations, substantially reducing the number of candidates evaluated. Importantly, the model only uses data collected during the search process, and doesn’t need the user to provide any additional data. Using ML, we can reduce autotuning time substantially without sacrificing performance: On our set of benchmark NVIDIA B200 kernels, we reduce autotuning time by 36.5% while improving kernel latency by 2.6%

## Nano Banana 2: Combining Pro capabilities with lightning-fast speed
- **Source**: blog (researcher_blogs)
- **URL**: https://deepmind.google/blog/nano-banana-2-combining-pro-capabilities-with-lightning-fast-speed/
- **Date**: 2026-02-26T08:01:50+00:00
- **Metadata**: {"blog": "deepmind_research", "author": ""}

### Content
Our latest image generation model offers advanced world knowledge, production ready specs, subject consistency and more, all at Flash speed.

## The Batch - Issue 342
- **Source**: newsletter (newsletters)
- **URL**: https://www.deeplearning.ai/the-batch/issue-342
- **Date**: 2026-02-28T17:18:00.082315+00:00
- **Metadata**: {"newsletter": "the_batch", "publisher": "deeplearning.ai"}

### Content
Dear friends,
We just released a Skill Builder tool to help you understand in which areas of AI you’re strong, where you can learn more, and what to do next to keep building your skills. I invite you to have a conversation with it.
There are many job opportunities in AI! Employers are eager to hire people with AI skills. But the landscape of AI technology is large, growing, and rapidly changing. To navigate this landscape, many people find that occasional conversations with a knowledgeable, trusted mentor are helpful for deciding where to go next.
Our Skill Builder serves this role. Tell it about your AI projects, and it will provide personalized feedback on where you are and suggest ways to take your AI skills to the next level. This is designed for everyone, from beginners who use AI only by prompting ChatGPT to advanced users who are building complex agentic workflows with multiple AI building blocks and a sophisticated development process.
When I’m learning a new skill, I find it hard to understand where I stand in the field, since I don’t yet know what I don’t know. Skill Builder addresses this for AI skills. It’s free for everyone to use, and many have reported finding the conversations informative. Following the conversation, it will show everyone a summary report and recommend what to learn next. DeepLearning.AI Pro members additionally get more-detailed personalized feedback.
Whether you’re checking your skills, deciding what project to work on next, choosing which course to take, or preparing for job interviews, I hope Skill Builder will help you move forward with clarity.
Keep building your skills!
Andrew
A MESSAGE FROM DEEPLEARNING.AI
You don’t need to learn how to code to build an app. In Build with Andrew, Andrew Ng shows how to turn ideas into working web apps using simple instructions. Perfect for beginners and easy to share with someone who has been waiting to start. Explore the course today!
News
Gemini Takes the Lead
Google updated its flagship Ge

## The Batch - Issue 341
- **Source**: newsletter (newsletters)
- **URL**: https://www.deeplearning.ai/the-batch/issue-341
- **Date**: 2026-02-28T17:18:03.593898+00:00
- **Metadata**: {"newsletter": "the_batch", "publisher": "deeplearning.ai"}

### Content
Dear friends,
Will AI create new job opportunities? My daughter Nova loves cats, and her favorite color is yellow. For her 7th birthday, we got a cat-themed cake in yellow by first using Gemini’s Nano Banana to design it, and then asking a baker to create it using delicious sponge cake and icing. My daughter was delighted by this unique creation, and the process created additional work for the baker (which I feel privileged to have been able to afford).
Many people are worried about AI taking peoples’ jobs. As a society we have a moral responsibility to take care of people whose livelihoods are harmed. At the same time, I see many opportunities for people to take on new jobs and grow their areas of responsibility.
We are still early on the path of AI generating a lot of new jobs. I don't know if baking AI-designed cakes will grow into a large business. (AI Fund is not pursuing this opportunity, because if we do, I will gain a lot of weight.) But throughout history, when people have invented tools that unleashed human creativity, large amounts of new and meaningful work have resulted. For instance, according to one study, over the past 150 years, falling employment in agriculture and manufacturing has been “more than offset by rapid growth in the caring, creative, technology, and business services sectors.”
AI is also growing the demand for many digital services, which can translate into more work for people creating, maintaining, selling, and expanding upon these services. For example, I used to carry out a limited number of web searches every day. Today, my coding agents carry out dramatically more web searches. For example, the Agentic Reviewer, which I started as a weekend project and Yixing Jiang then helped make much better, automatically reviews research articles. It uses a web search API to search for related work, and this generates a vastly larger number of web search queries a day than I have ever entered by hand.
The evolution of AI and software continues

## The Batch - Issue 340
- **Source**: newsletter (newsletters)
- **URL**: https://www.deeplearning.ai/the-batch/issue-340
- **Date**: 2026-02-28T17:18:05.324345+00:00
- **Metadata**: {"newsletter": "the_batch", "publisher": "deeplearning.ai"}

### Content
Dear friends,
I recently spoke at the Sundance Film Festival on a panel about AI. Sundance is an annual gathering of filmmakers and movie buffs that serves as the premier showcase for independent films in the United States. Knowing that many people in Hollywood are extremely uncomfortable about AI, I decided to immerse myself for a day in this community to learn about their anxieties and build bridges.
I’m grateful to Daniel Dae Kim, an actor/producer/director I’ve come to respect deeply for his artistic and social work, for organizing the panel, which also included Daniel, Dan Kwan, Jonathan Wang, and Janet Yang. I found myself surrounded by award-winning filmmakers and definitely felt like the odd person out!
First, Hollywood has many reasons to be uncomfortable with AI. People from the entertainment industry come from a very different culture than many who work in tech, and this drives deep differences in what we focus on and what we value. A significant subset of Hollywood is concerned that:
- AI companies are taking their work to learn from it without consent and compensation. Whereas the software industry is used to open source and the open internet, Hollywood focuses much more on intellectual property, which underlies the core economic engines of the entertainment industry.
- Powerful unions like SAG-AFTRA (Screen Actors Guild-American Federation of Television and Radio Artists) are deeply concerned about protecting the jobs of their members. When AI technology (or any other force) threatens the livelihoods of their members — like voice actors — they will fight mightily against potential job losses.
- This wave of technological change feels forced on them more than previous waves, where they felt more free to adopt or reject the technology. For example, celebrities felt like it was up to them whether to use social media. In contrast, negative messaging from some AI leaders who present the technology as unstoppable, perhaps even a dangerous force that will wip
