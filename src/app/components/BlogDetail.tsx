import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Calendar, User, Heart, ArrowRight, Quote, CheckCircle, ThumbsUp, ThumbsDown, Eye } from "lucide-react";

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

// ─── Article data & full content ───────────────────────────
export interface Article {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  photo: string;
  body: ArticleSection[];
  views?: number;
  likes?: number;
  dislikes?: number;
}

type ArticleSection =
  | { type: "p";    text: string }
  | { type: "h2";   text: string }
  | { type: "h3";   text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export const ARTICLES: Article[] = [
  // ─── ARTICLE 1 ────────────────────────────────────────────
  {
    id: 1,
    category: "Compatibility",
    title: "Why Compatibility Matters More Than Chemistry (And How to Find It)",
    excerpt: "Chemistry fades. Compatibility — grounded in shared values, aligned goals, and complementary communication styles — is what sustains a marriage.",
    author: "Mariam Rashid",
    authorRole: "Psychologist & Relationship Researcher",
    date: "June 28, 2026",
    readTime: "7 min read", views: 4820, likes: 312, dislikes: 14,
    photo: u("1474552226712-ac0f0961a954", 1200, 600),
    body: [
      {
        type: "p",
        text: "We are taught from an early age to trust the feeling. That electricity in the stomach, the racing heart, the inexplicable pull toward another person — this is what we call chemistry, and we have been told, through films and songs and generations of cultural mythology, that it is the foundation of lasting love."
      },
      {
        type: "p",
        text: "It is not. Chemistry is a beginning — an invitation to look closer. But it is a notoriously unreliable guide to whether two people can build a life together. And the sooner we stop treating it as the primary signal, the better our chances of finding a relationship that actually endures."
      },
      {
        type: "h2",
        text: "What Chemistry Actually Is"
      },
      {
        type: "p",
        text: "Chemistry is primarily a neurochemical event. In the early stages of romantic attraction, the brain releases a cocktail of dopamine, norepinephrine, and serotonin that creates feelings of euphoria, obsession, and heightened attention. This phase is sometimes called limerence, and it typically lasts between six months and two years."
      },
      {
        type: "p",
        text: "What happens after that window closes is where most relationships struggle. The neurochemicals normalise. The intensity fades. And what remains — if anything remains — is the actual substance of the relationship: values, communication, shared goals, mutual respect. That substance is compatibility."
      },
      {
        type: "quote",
        text: "Two people can have extraordinary chemistry and nothing to talk about after six months. Two people can have quiet, easy compatibility and build something that lasts forty years.",
        attribution: "Dr. Mariam Rashid"
      },
      {
        type: "h2",
        text: "The Four Dimensions of Compatibility"
      },
      {
        type: "p",
        text: "Through research and practice, I've come to understand compatibility as operating across four distinct but interconnected dimensions. The depth of alignment across all four determines the stability and fulfilment of a long-term relationship."
      },
      {
        type: "h3",
        text: "1. Values Compatibility"
      },
      {
        type: "p",
        text: "Values are the operating principles by which a person lives. They include religious and spiritual orientation, views on family and community, ethical frameworks, and what a person considers a life well lived. Values compatibility does not mean two people must be identical — it means their core operating principles are congruent enough that they do not produce ongoing conflict."
      },
      {
        type: "p",
        text: "A couple where one partner holds family as the highest priority and another treats career advancement as paramount will face structural friction, regardless of how strong their initial attraction was. These are not differences to be ironed out through goodwill; they are fundamental divergences in direction."
      },
      {
        type: "h3",
        text: "2. Communication Compatibility"
      },
      {
        type: "p",
        text: "Communication style is perhaps the most overlooked dimension of compatibility, and arguably the most consequential. People do not merely differ in what they say — they differ in how they process, express, and receive. Some people need verbal affirmation; others find grand declarations uncomfortable. Some process conflict through immediate, direct conversation; others need silence and space before they can engage productively."
      },
      {
        type: "p",
        text: "A misalignment in communication styles does not mean a couple cannot work — but it does mean they will need to develop a shared language. And that requires awareness that the gap exists in the first place. Most couples don't discover this until they're already in conflict."
      },
      {
        type: "h3",
        text: "3. Life Goals Compatibility"
      },
      {
        type: "p",
        text: "Where does a person want to live? Do they want children, and how many? What does their ideal decade look like — building a career, travelling, community involvement, entrepreneurship, raising a family? Goals compatibility is about shared direction: not identical paths, but trajectories that run parallel closely enough that two people can walk together without one perpetually waiting for the other."
      },
      {
        type: "h3",
        text: "4. Lifestyle Compatibility"
      },
      {
        type: "p",
        text: "The texture of daily life — sleep patterns, social needs, financial philosophy, health habits, approaches to leisure — determines the quality of the ordinary days. Grand romantic gestures are rare; Tuesday mornings are not. A couple who are misaligned on lifestyle will find that the accumulation of small frictions erodes what goodwill their chemistry once generated."
      },
      {
        type: "h2",
        text: "Why Couples Choose Chemistry Over Compatibility"
      },
      {
        type: "p",
        text: "Because compatibility, unlike chemistry, requires intention to assess. Chemistry announces itself. Compatibility must be investigated. It requires asking the harder questions early — not in a clinical, checklist manner, but with genuine curiosity about who another person is, what they believe, how they operate under stress, and what they actually want from life."
      },
      {
        type: "p",
        text: "Most of us are not trained for this. We are trained to pursue the feeling, to trust the spark, and to hope that the rest will work itself out. It usually does not. Not because people are incompatible as human beings, but because they were never honest — often not even with themselves — about what they needed."
      },
      {
        type: "callout",
        text: "Compatibility is not the absence of differences. It is the presence of enough alignment that those differences become interesting rather than destructive."
      },
      {
        type: "h2",
        text: "How to Assess Compatibility Honestly"
      },
      {
        type: "list",
        items: [
          "Ask about values early and directly, without treating it as a test. Curiosity is not an interrogation.",
          "Watch how someone handles frustration, disappointment, and conflict — not just how they are when things are easy.",
          "Be honest about your own non-negotiables. You cannot assess compatibility if you have not first assessed yourself.",
          "Pay attention to the ordinary. How does this person treat service staff? How do they respond to a change in plans? What do they do on a Sunday afternoon?",
          "Have the uncomfortable conversations before you are in a situation that forces you to. It is far easier to discuss finances, children, and location before attachment deepens.",
        ]
      },
      {
        type: "h2",
        text: "The Good News"
      },
      {
        type: "p",
        text: "Chemistry and compatibility are not mutually exclusive. Many couples have both. But the couples who thrive are those who built their relationship on compatibility, and allowed chemistry to be the pleasant backdrop to that foundation — not the foundation itself."
      },
      {
        type: "p",
        text: "If you find yourself drawn to someone and you don't yet know whether you're compatible: that's not a problem. That's the beginning of the real work. And that work — the genuine effort to understand another person deeply enough to build a life with them — is, in my experience, worth every moment of discomfort it requires."
      },
    ],
  },

  // ─── ARTICLE 2 ────────────────────────────────────────────
  {
    id: 2,
    category: "Communication",
    title: "The One Conversation Every Couple Should Have Before Marriage",
    excerpt: "Most couples spend months planning a wedding and hours discussing finances, but almost no time aligning on communication styles. This changes that.",
    author: "Layla Hassan",
    authorRole: "Co-Founder & CTO, Ma3moni",
    date: "June 20, 2026",
    readTime: "5 min read", views: 3560, likes: 241, dislikes: 8,
    photo: u("1579208570378-8c970854bc23", 1200, 600),
    body: [
      {
        type: "p",
        text: "When couples encounter serious conflict early in marriage, the precipitating issue is rarely what it appears to be. It is not the finances, or the in-laws, or the division of household labour. It is almost always something underneath all of those things: two people who assumed they knew how to talk to each other, and discovered — too late and with too much pain — that they did not."
      },
      {
        type: "p",
        text: "The conversation I'm describing is not about whether you want children (you should have that one too). It's not about finances, or where you'll live. It's about how you communicate — and it is the one conversation most engaged couples never have."
      },
      {
        type: "h2",
        text: "Why Communication Style Is Overlooked"
      },
      {
        type: "p",
        text: "Communication, in most pre-marriage frameworks, is treated as a skill that can be improved — a tool, not a trait. Couples are told to 'communicate better', to use 'I statements', to listen actively. These are useful techniques. But they treat communication as a surface behaviour, when in reality it is one of the deepest expressions of who a person is."
      },
      {
        type: "p",
        text: "People do not merely differ in what they say. They differ in whether they need to speak at all in order to feel understood. They differ in whether silence means comfort or avoidance. They differ in how much time they need between a triggering event and being able to engage productively. They differ in whether conflict feels threatening or resolving. They differ in whether they communicate by sharing facts, sharing feelings, or both."
      },
      {
        type: "quote",
        text: "The most dangerous assumption in a relationship is that 'we communicate well' — usually spoken before the first serious conflict reveals that you communicate well only when nothing difficult is happening.",
        attribution: "Layla Hassan"
      },
      {
        type: "h2",
        text: "The Five Questions"
      },
      {
        type: "p",
        text: "Below are five questions to have with a partner before marriage. They are not a test. They are not a checklist. They are starting points for a conversation that may go in many directions. What matters is not having the right answers — it is being honest about your actual experience, and listening to hear your partner's."
      },
      {
        type: "h3",
        text: "1. When you're upset, what do you need most?"
      },
      {
        type: "p",
        text: "Some people need to talk through it immediately. Others need to withdraw and process alone before they can engage. Neither is wrong. But if one partner is a processor and the other is an immediate engager, and neither knows this about the other, the processor will seem cold and the engager will seem overwhelming — and both will be right."
      },
      {
        type: "h3",
        text: "2. How do you know you've been heard?"
      },
      {
        type: "p",
        text: "For some people, being heard means receiving verbal acknowledgement. For others, it means the other person changes their behaviour. For others still, it means simply having someone sit with them without trying to fix anything. If you are providing the wrong kind of listening, your partner will feel unheard even when you are present and attentive."
      },
      {
        type: "h3",
        text: "3. What did conflict look like in the home you grew up in?"
      },
      {
        type: "p",
        text: "The template for how conflict should be handled was laid in childhood, whether we are aware of it or not. A person who grew up in a home where disagreements were resolved loudly and quickly will have entirely different expectations than someone from a home where conflict was managed through quiet withdrawal. Neither approach is inherently better — but two people operating from incompatible templates without awareness will interpret each other's behaviour as character flaws."
      },
      {
        type: "h3",
        text: "4. What topic are you most afraid to bring up with me?"
      },
      {
        type: "p",
        text: "This question is uncomfortable by design. The answer reveals not only what your partner finds difficult to discuss, but also how safe they feel with you. If the answer is 'nothing', probe gently — there is almost always something. If there is genuinely nothing, you may be looking at extraordinary trust or a relationship that has not yet encountered real difficulty."
      },
      {
        type: "h3",
        text: "5. How do you feel after an argument — and what do you need to move forward?"
      },
      {
        type: "p",
        text: "The aftermath of conflict is as important as its resolution. Some people need explicit reconciliation — a conversation that closes the loop. Others need time, and interpret a forced closure as inauthentic. Understanding what your partner needs to feel genuinely resolved — not just superficially past the conflict — is essential to preventing resentment from accumulating."
      },
      {
        type: "h2",
        text: "How to Have This Conversation"
      },
      {
        type: "list",
        items: [
          "Choose a neutral moment — not when you're already in conflict, and not in a formal, weighted setting.",
          "Go through the questions one at a time, with space between them. Let the conversation breathe.",
          "Answer yourself before asking your partner. Reciprocity makes this feel collaborative, not interrogative.",
          "Resist the urge to reassure immediately. If your partner shares something difficult, sit with it first.",
          "Revisit the conversation. Communication styles evolve. What is true at 28 may shift by 35.",
        ]
      },
      {
        type: "callout",
        text: "Two people who understand how each other communicates can navigate almost any difficulty. Two people who don't understand this about each other will struggle with even the small ones."
      },
      {
        type: "p",
        text: "This conversation is not a guarantee. It will not prevent all conflict. But it will mean that when conflict comes — and it will come — you have something to stand on. You will have a shared understanding of how the other person is wired, and that understanding is the beginning of the fluency that lasting relationships require."
      },
    ],
  },

  // ─── ARTICLE 3 ────────────────────────────────────────────
  {
    id: 3,
    category: "Values",
    title: "How to Identify Your Non-Negotiables Without Being Unrealistic",
    excerpt: "There's a difference between standards and expectations. Understanding that difference is what separates someone who finds the right partner from someone who doesn't.",
    author: "Mariam Rashid",
    authorRole: "Psychologist & Relationship Researcher",
    date: "June 14, 2026",
    readTime: "6 min read", views: 2940, likes: 198, dislikes: 22,
    photo: u("1606800052052-a08af7148866", 1200, 600),
    body: [
      {
        type: "p",
        text: "There is a peculiar thing that happens when people who have been single for a long time are asked to describe their ideal partner. Their lists are either exhaustively specific — a catalogue of traits so precise that the described person could not possibly exist — or vague to the point of being meaningless: 'someone kind, someone who makes me laugh, someone with a good heart.'"
      },
      {
        type: "p",
        text: "Both extremes reflect the same underlying problem: an absence of genuine self-knowledge. The person with the exhaustive list has mistaken preferences for needs. The person with the vague list has avoided the discomfort of examining what they actually require. Neither approach produces clarity about what they are truly looking for."
      },
      {
        type: "h2",
        text: "Non-Negotiables vs Preferences: The Core Distinction"
      },
      {
        type: "p",
        text: "A non-negotiable is a characteristic or value whose absence would make a relationship fundamentally incompatible with who you are or how you want to live. It is not something you could eventually work around, negotiate, or decide doesn't matter. It is structural. Its absence would create an ongoing tension that cannot be resolved through goodwill, compromise, or personal growth."
      },
      {
        type: "p",
        text: "A preference is something you would like but could genuinely imagine being happy without. The distinction matters enormously, because treating preferences as non-negotiables is one of the primary reasons otherwise compatible people don't find each other."
      },
      {
        type: "quote",
        text: "Most people have two or three genuine non-negotiables. Everything else on their list is a preference wearing the costume of a requirement.",
        attribution: "Dr. Mariam Rashid"
      },
      {
        type: "h2",
        text: "The Test for a Genuine Non-Negotiable"
      },
      {
        type: "p",
        text: "The question to ask is not: 'Do I want this in a partner?' That question will always return yes. The question is: 'Could I build a genuinely fulfilling life with someone who does not have this quality?'"
      },
      {
        type: "p",
        text: "If the honest answer is no — if the absence of that quality would create ongoing friction, resentment, or a fundamental misalignment in how you want to live — then it is a non-negotiable. If you can honestly imagine a version of a life without it where you are still at peace, then it is a preference, regardless of how strongly you hold it."
      },
      {
        type: "h3",
        text: "Common examples of genuine non-negotiables:"
      },
      {
        type: "list",
        items: [
          "Alignment on whether to have children (a difference here cannot be compromised)",
          "Religious or spiritual orientation, where faith is central to your daily life",
          "Geographic commitment (if you are rooted in a specific place for deep reasons)",
          "Core ethical values — honesty, integrity, how a person treats others",
          "Readiness for marriage within a similar timeframe",
        ]
      },
      {
        type: "h3",
        text: "Common examples of preferences masquerading as non-negotiables:"
      },
      {
        type: "list",
        items: [
          "Specific height, build, or physical appearance beyond general attraction",
          "Particular educational institution or degree (versus education level in general)",
          "A precise income bracket",
          "Hobby or interest overlap ('must love the same films I do')",
          "Social style that exactly mirrors yours",
        ]
      },
      {
        type: "h2",
        text: "Why People Get This Wrong"
      },
      {
        type: "p",
        text: "The conflation of preferences and non-negotiables is rarely about being shallow. It is almost always about fear — specifically, the fear of vulnerability that comes with being genuinely honest about what you need. Claiming a long list of requirements provides a kind of insulation: if no one meets the criteria, you are protected from the risk of connection."
      },
      {
        type: "p",
        text: "There is also a cultural dimension. In many communities, the external markers of a partner's suitability — profession, family background, income — are treated as requirements because they carry the weight of social approval. These are real considerations. But they are not the same as the internal alignments — on values, on character, on how a person wants to build a life — that actually determine whether two people will be happy together."
      },
      {
        type: "callout",
        text: "The goal is not to lower your standards. It is to understand which of your standards are genuinely yours, and which ones were inherited from expectation."
      },
      {
        type: "h2",
        text: "A Process for Building Your List"
      },
      {
        type: "p",
        text: "Start by writing down everything you believe you want in a partner. Every quality, every characteristic, everything you have ever said or thought you needed. Write it all down without filtering."
      },
      {
        type: "p",
        text: "Then, for each item on the list, ask the test question: could I build a genuinely fulfilling life with someone who does not have this? If the answer is a clear no, it stays on the non-negotiables list. If there is any honest ambiguity — if you can picture a version of happiness without it — move it to preferences."
      },
      {
        type: "p",
        text: "Most people, when they complete this exercise honestly, end up with two to four genuine non-negotiables and a much longer list of preferences. That is the correct outcome. It is not a narrowing of what you want. It is a clarification of what you require — which is the only foundation from which a genuine search can begin."
      },
      {
        type: "h2",
        text: "The Other Side: Know What You Bring"
      },
      {
        type: "p",
        text: "Clarity about what you need from a partner is only half of the exercise. The other half — and in my experience the harder half — is honesty about what you offer. The person who has a long and exacting list of requirements but has not examined their own growth areas, their own patterns, their own readiness, is not preparing for a relationship. They are preparing for disappointment."
      },
      {
        type: "p",
        text: "Self-knowledge and other-knowledge are inseparable. You cannot accurately assess compatibility without knowing yourself — genuinely, uncomfortably, with rigour and grace. The couples who find each other are almost always the ones who did that work first."
      },
    ],
  },

  // ─── ARTICLE 4 ────────────────────────────────────────────
  {
    id: 4,
    category: "Relationships",
    title: "Long-Distance Relationships: What Our Data Actually Shows",
    excerpt: "Of all the relationships formed on Ma3moni, 23% started long-distance. Here's what we've learned about what makes them work — and what doesn't.",
    author: "Faisal Al-Amin",
    authorRole: "Co-Founder & CEO, Ma3moni",
    date: "June 7, 2026",
    readTime: "8 min read", views: 2100, likes: 145, dislikes: 11,
    photo: u("1534630103086-5b1c106f74e0", 1200, 600),
    body: [
      { type: "p", text: "When we launched Ma3moni, we assumed that most successful matches would happen between people in the same city. It seemed logical. Proximity reduces friction. Seeing each other regularly is easier. The relationship can develop at a natural pace without the added complexity of geography." },
      { type: "p", text: "The data proved us partially wrong. Twenty-three percent of the relationships formed on Ma3moni in the past two years began long-distance — a figure that surprised us, and that forced us to look more carefully at what was actually happening in those matches." },
      { type: "h2", text: "What We Found" },
      { type: "p", text: "The long-distance matches on Ma3moni succeed at a rate slightly higher than the platform average. Not dramatically higher — but measurably so. When we dug into why, two factors emerged consistently." },
      { type: "p", text: "First: the couples who thrived had a concrete plan for co-location from very early in the relationship. Not a vague intention, but an actual timeline. 'We agreed within the first month that one of us would relocate within eighteen months' — this kind of specificity appeared repeatedly in the conversations we analysed." },
      { type: "p", text: "Second: they communicated with unusual intentionality. Distance, it turns out, is a peculiar accelerant. When you cannot be physically present, you are forced to rely entirely on words — and couples who invest in verbal and written communication often know each other more deeply, faster, than couples who can default to physical proximity as a substitute for genuine understanding." },
      { type: "quote", text: "Distance doesn't make relationships harder. Ambiguity makes relationships harder. Distance just removes the ability to hide behind ambiguity.", attribution: "Faisal Al-Amin" },
      { type: "h2", text: "What Makes Long-Distance Work" },
      { type: "h3", text: "1. Agreement on the endpoint" },
      { type: "p", text: "The relationships that struggle are not the ones where two people are separated by distance — they are the ones where two people are separated by a lack of shared direction. If one partner is open to relocation and the other is not, distance is not the problem; incompatibility on this fundamental question is." },
      { type: "p", text: "The first conversation a long-distance couple should have — before they are emotionally invested enough that the answer becomes dangerous — is: what does the path to being in the same place look like, and are we both willing to walk it?" },
      { type: "h3", text: "2. Structured communication" },
      { type: "p", text: "Consistency matters more than frequency. Couples who set regular communication rhythms — a video call every evening, a voice note every morning — report feeling more connected than those who communicate more sporadically but at higher volume." },
      { type: "p", text: "The quality of communication also shifts in long-distance relationships. Without the shorthand of shared daily life, partners have to describe their inner state more explicitly. This can feel effortful. It is also one of the primary reasons long-distance couples often describe an unusually strong emotional intimacy." },
      { type: "h3", text: "3. Defined visit schedule" },
      { type: "p", text: "Indefinite anticipation is exhausting. Couples who know when they will next see each other — even if it is three months away — report significantly lower anxiety than those navigating open-ended timelines. The visit itself matters; the certainty that it is coming matters more." },
      { type: "callout", text: "The most predictive variable for long-distance success we found wasn't the distance, or the culture, or even the communication style. It was whether both people had genuinely resolved the relocation question before they were too attached to answer it honestly." },
      { type: "h2", text: "What Doesn't Work" },
      { type: "p", text: "The long-distance relationships that ended on Ma3moni almost always fell into one of three patterns: an unresolved location question that one or both partners avoided discussing; a relationship that had drifted into a comfortable but progressing-nowhere phase; or a fundamental mismatch in how much physical presence each person needed to feel connected." },
      { type: "p", text: "That last one is underappreciated. Some people are genuinely wired to maintain emotional intimacy through communication alone. Others need physical presence to feel secure in a relationship. Neither is better. But a relationship where one person is the former and the other is the latter will face a structural friction that goodwill alone cannot resolve." },
      { type: "h2", text: "A Note on Using Ma3moni Long-Distance" },
      { type: "p", text: "If you are open to long-distance matches, make sure your partner preferences reflect this. Our algorithm will widen your pool significantly. More importantly, if you do match with someone at a distance, have the relocation conversation early. Not as a pressure test, but as a genuine exploration of whether you are both pointing in the same direction. That conversation, early and honestly, is the single most useful thing you can do to assess whether the distance is a logistical detail or a structural incompatibility." },
    ],
  },

  // ─── ARTICLE 5 ────────────────────────────────────────────
  {
    id: 5,
    category: "Values",
    title: "Faith, Values, and Marriage: Navigating What Matters in a Secular Age",
    excerpt: "More couples than ever are navigating different levels of religious practice. Here's how to have that conversation clearly and compassionately.",
    author: "Mariam Rashid",
    authorRole: "Psychologist & Relationship Researcher",
    date: "May 22, 2026",
    readTime: "6 min read", views: 1876, likes: 133, dislikes: 9,
    photo: u("1621801306185-8c0ccf9c8eb8", 1200, 600),
    body: [
      { type: "p", text: "In my work with couples and individuals navigating the marriage question, few topics produce more anxiety than faith. Not because religion is inherently difficult to discuss — but because the conversation carries so many layers: family expectations, personal identity, unresolved questions about practice, and the fear of saying something that will end a promising connection before it has begun." },
      { type: "p", text: "What I want to offer here is a framework for thinking about faith and marriage that moves beyond the binary of 'religious or not' and toward a more honest and useful set of questions." },
      { type: "h2", text: "The Problem with the Binary" },
      { type: "p", text: "Religious practice exists on a spectrum, not as a binary. Two people can both describe themselves as 'practicing Muslims' — or 'practicing Catholics', or 'traditional Jews' — and mean very different things. One person might pray five times a day, observe every dietary law, and structure their social life entirely around their faith community. Another might observe the major holidays, hold a deep personal faith, and describe their practice as private and internal. Both are sincere. Their day-to-day experience of living a religiously informed life is almost entirely different." },
      { type: "p", text: "This spectrum reality is important because it means the question 'are they religious?' is almost entirely uninformative. The questions that matter are much more specific." },
      { type: "h2", text: "The Questions That Actually Matter" },
      { type: "h3", text: "How will we practise?" },
      { type: "p", text: "In a household. On a daily basis. On religious occasions. During Ramadan, or Lent, or the High Holidays, or the weekly Sabbath. What does practice look like in the home you want to build? This is not an abstract question — it is a practical one with direct implications for how you will structure your mornings, your evenings, your weekends, and your calendar." },
      { type: "h3", text: "How will we raise our children?" },
      { type: "p", text: "This is the question that most couples avoid until it is urgent, and then discover they have profoundly different assumptions about. The answer doesn't need to be identical to be compatible — but both people need to be genuinely comfortable with the answer, not merely tolerant of it. Tolerance erodes. Genuine acceptance doesn't." },
      { type: "h3", text: "Where are the non-negotiable observances?" },
      { type: "p", text: "Almost everyone has at least one. Some people can be flexible about daily practice but are absolute about Friday prayers, or Saturday rest, or specific dietary laws. Understanding where the firm commitments lie — and whether a partner is genuinely comfortable with them, not just currently willing to accommodate them — is essential to an honest assessment of compatibility." },
      { type: "quote", text: "The question is not whether your partner shares your faith. The question is whether they can honour it — genuinely, not grudgingly — and whether you can do the same for theirs.", attribution: "Dr. Mariam Rashid" },
      { type: "h2", text: "When Practice Levels Differ" },
      { type: "p", text: "Different levels of practice are navigable. They are not inherently incompatible. What makes the difference is: whether both people have been honest about where they actually are (not where they aspire to be or where their family expects them to be); whether both are genuinely respectful of the other's practice without requiring change; and whether the vision for the household they want to build is one both can inhabit authentically." },
      { type: "p", text: "What is not navigable is one partner privately expecting the other to change over time. This is the source of more marital difficulty in religiously mixed couples than any other single factor. If you are entering a relationship hoping that your partner will become more observant, or less, or different in some way over time — that is a plan built on a person who does not currently exist." },
      { type: "callout", text: "Compatibility on faith is not about matching belief systems. It is about being able to build a shared life in which both people can practise authentically, without resentment, and without one person diminishing for the other." },
      { type: "h2", text: "A Practical Starting Point" },
      { type: "p", text: "Begin by being honest with yourself. Not about where you think you should be in your practice, or where your family expects you to be — but about where you actually are, and where you genuinely want to be in ten years. Then have that conversation with a potential partner. Not as an interview. As a genuine sharing of who you are." },
      { type: "p", text: "And listen, when they answer, for the actual substance of what they are describing — not for whether it matches a template you have constructed. The person in front of you is not an abstract category. They are a specific, complex human being navigating the same uncertain terrain you are. Meeting them there, with honesty and without judgment, is the beginning of the only kind of compatibility that actually matters." },
    ],
  },

  // ─── ARTICLE 6 ────────────────────────────────────────────
  {
    id: 6,
    category: "Compatibility",
    title: "The Science Behind the Ma3moni Compatibility Score",
    excerpt: "How do we calculate that number? What data goes into it? And why is it actually useful — unlike most personality tests? Our CTO explains.",
    author: "Layla Hassan",
    authorRole: "Co-Founder & CTO, Ma3moni",
    date: "May 15, 2026",
    readTime: "9 min read", views: 1430, likes: 98, dislikes: 6,
    photo: u("1465495976277-4387d4b0b4c6", 1200, 600),
    body: [
      { type: "p", text: "The most common question we receive at Ma3moni is some version of: 'What does the percentage actually mean?' It's a fair question. Compatibility scores have a poor reputation — and rightly so. Most of them are dressed-up personality inventories that correlate people based on Myers-Briggs types or attachment styles and present the output as meaningful matching. It rarely is." },
      { type: "p", text: "Our score is built differently. This article explains how, and why the distinction matters." },
      { type: "h2", text: "What the Score Is Not" },
      { type: "p", text: "The Ma3moni compatibility score is not a personality type match. It does not assess introversion and extroversion, or emotional attachment patterns, or Enneagram numbers. These frameworks have genuine value for self-understanding, but they are poor predictors of relationship satisfaction in practice. The research on this is fairly consistent: personality type similarity is a weak indicator of relationship quality." },
      { type: "p", text: "The score is also not based on demographic similarity. Similar age, education level, or professional background are convenient proxies that dating platforms often use because they are easy to collect. They are genuinely poor predictors of whether two people will build a satisfying life together." },
      { type: "h2", text: "What the Score Actually Measures" },
      { type: "p", text: "The Ma3moni score measures alignment across four primary dimensions, each of which is assessed through your onboarding responses and weighted by the importance you assign to it." },
      { type: "h3", text: "1. Values Alignment (weighted 35%)" },
      { type: "p", text: "This dimension captures alignment on the deepest operating principles: religious practice level, family orientation, views on community and service, and core ethical frameworks. It is the highest-weighted dimension because values misalignment is the most cited source of long-term relationship difficulty, and the hardest to resolve through effort and goodwill." },
      { type: "h3", text: "2. Life Goals Alignment (weighted 30%)" },
      { type: "p", text: "This captures directional compatibility: the decision about children, geographic preference, the shape of the life both people want to build. Where values alignment describes who a person is, life goals alignment describes where they are going. Both matter; together they are the primary determinants of structural compatibility." },
      { type: "h3", text: "3. Communication Style Fit (weighted 20%)" },
      { type: "p", text: "This is where our model diverges most from industry convention. Most platforms ignore communication style entirely. We weight it at 20% because the research is clear: couples who are misaligned on communication — not on what they say but on how they process, express, and receive — accumulate friction at every interaction, even when everything else is compatible." },
      { type: "h3", text: "4. Lifestyle Compatibility (weighted 15%)" },
      { type: "p", text: "The texture of daily life: social needs, health habits, financial philosophy, approach to leisure. This is the lowest-weighted dimension not because it is unimportant, but because it is the most negotiable. Two people who are deeply aligned on values, goals, and communication can usually find a sustainable accommodation on lifestyle differences. The reverse is not reliably true." },
      { type: "callout", text: "The score is a starting point, not a verdict. A 94% match does not guarantee happiness. A 79% match does not preclude it. What the score does is surface the dimensions of alignment and misalignment clearly — so you can have more honest conversations earlier." },
      { type: "h2", text: "How Your Preference Weights Shape the Score" },
      { type: "p", text: "When you complete your onboarding, you categorise your partner preferences as Must-Have, Important, or Nice-to-Have. These weightings directly affect how your compatibility score is calculated for any given match." },
      { type: "p", text: "If you mark religious practice alignment as Must-Have, then a significant divergence in that dimension will reduce your compatibility score substantially — regardless of how well-aligned you are elsewhere. If you mark it as Nice-to-Have, that same divergence will have a much smaller effect. This is intentional: the score should reflect your priorities, not a generic average." },
      { type: "h2", text: "Why We Show the Breakdown" },
      { type: "p", text: "The breakdown — the separate scores for values, goals, communication, and lifestyle — is as important as the overall number. A 90% overall score where three dimensions are at 95% and one is at 68% tells a different story than a 90% where all four are in the 88–92% range. The former may indicate a single significant tension point. The latter suggests broad, even alignment." },
      { type: "p", text: "We surface this breakdown deliberately, because we want couples to walk into their first conversation with a specific, honest map of where they are likely to be aligned and where they may need to invest more attention. The score is a diagnostic, not a conclusion." },
      { type: "h2", text: "What the Research Actually Supports" },
      { type: "p", text: "The academic literature on relationship satisfaction is consistent on a handful of findings: values similarity, shared long-term goals, and communication compatibility are the strongest predictors of sustained relationship quality. Physical attraction matters in initiation; it becomes progressively less predictive of satisfaction over time. Demographic similarity (age, education, income) matters marginally, primarily as a proxy for the values and lifestyle similarities that are the actual operative variables." },
      { type: "p", text: "Our model is built on this literature. It is not infallible. No matching algorithm can account for the irreducible mystery of human chemistry, or the quality of someone's character in the moments that test it. What it can do — and what we believe it does well — is surface the structural variables that determine whether two people have the raw material for a lasting relationship. The rest is up to them." },
    ],
  },
];

// ─── Render helpers ───────────────────────────────────────
function ArticleBody({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((s, i) => {
        if (s.type === "p") {
          return (
            <p key={i} className="text-foreground" style={{ fontSize: "1.0625rem", lineHeight: 1.85 }}>
              {s.text}
            </p>
          );
        }
        if (s.type === "h2") {
          return (
            <h2 key={i} style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em", marginTop: "2.5rem", marginBottom: "0.75rem" }}>
              {s.text}
            </h2>
          );
        }
        if (s.type === "h3") {
          return (
            <h3 key={i} style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.015em", marginTop: "1.75rem", marginBottom: "0.5rem" }}>
              {s.text}
            </h3>
          );
        }
        if (s.type === "quote") {
          return (
            <div key={i} className="relative pl-6 my-8">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-primary" />
              <Quote size={24} className="text-primary/30 mb-3" />
              <blockquote style={{ fontSize: "1.1875rem", fontWeight: 600, fontStyle: "italic", lineHeight: 1.6, color: "var(--foreground)" }}>
                "{s.text}"
              </blockquote>
              {s.attribution && (
                <p className="text-muted-foreground mt-3" style={{ fontSize: "0.875rem" }}>— {s.attribution}</p>
              )}
            </div>
          );
        }
        if (s.type === "list") {
          return (
            <ul key={i} className="space-y-3 my-4">
              {s.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-1" />
                  <span style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (s.type === "callout") {
          return (
            <div key={i} className="bg-secondary rounded-2xl border border-primary/15 px-7 py-6 my-8">
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--primary)", lineHeight: 1.6 }}>
                {s.text}
              </p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────
interface BlogDetailProps {
  articleId: number;
  onBack: () => void;
  onStart: () => void;
  backLabel?: string;
  onOpenArticle?: (id: number) => void;
}

export function BlogDetail({ articleId, onBack, onStart, backLabel = "Back to Home", onOpenArticle }: BlogDetailProps) {
  const article = ARTICLES.find(a => a.id === articleId);
  const related = ARTICLES.filter(a => a.id !== articleId);

  const voteKey = `ma3_vote_${articleId}`;
  const [likes, setLikes] = useState(() => {
    try { const s = sessionStorage.getItem(voteKey); return (s ? JSON.parse(s).likes : null) ?? (article?.likes ?? 0); } catch { return article?.likes ?? 0; }
  });
  const [dislikes, setDislikes] = useState(() => {
    try { const s = sessionStorage.getItem(voteKey); return (s ? JSON.parse(s).dislikes : null) ?? (article?.dislikes ?? 0); } catch { return article?.dislikes ?? 0; }
  });
  const viewKey = `ma3_viewed_${articleId}`;
  const [views] = useState(() => {
    const base = article?.views ?? 0;
    try {
      if (sessionStorage.getItem(viewKey)) return base;
      sessionStorage.setItem(viewKey, "1");
      return base + 1;
    } catch { return base; }
  });
  const [voted, setVoted] = useState<"like" | "dislike" | null>(() => {
    try { const s = sessionStorage.getItem(voteKey); return s ? JSON.parse(s).voted : null; } catch { return null; }
  });

  // Import blog API lazily to avoid circular deps in the same file
  const vote = async (v: "like" | "dislike") => {
    if (voted === v) return;
    const newLikes    = likes    + (v === "like"    ? 1 : 0) - (voted === "like"    ? 1 : 0);
    const newDislikes = dislikes + (v === "dislike" ? 1 : 0) - (voted === "dislike" ? 1 : 0);
    setLikes(newLikes); setDislikes(newDislikes); setVoted(v);
    try { sessionStorage.setItem(voteKey, JSON.stringify({ voted: v, likes: newLikes, dislikes: newDislikes })); } catch {}
    // Sync to API — best-effort
    try {
      const { blog } = await import("../../lib/api");
      const res = await blog.vote(String(articleId), v === "like" ? 1 : -1);
      setLikes(res.likes_count);
      setDislikes(res.dislikes_count);
    } catch {}
  };

  if (!article) return null;

  return (
    <div className="size-full overflow-y-auto bg-background">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontSize: "0.9rem" }}
          >
            <ArrowLeft size={17} />
            {backLabel}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Heart size={11} className="text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="logo-font" style={{ fontWeight: 800, fontSize: "0.9375rem" }}>Ma3moni</span>
          </div>
        </div>
      </div>

      {/* ── Hero image ── */}
      <div className="relative w-full" style={{ height: "clamp(260px, 40vh, 480px)" }}>
        <img
          src={article.photo}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(10,20,34,0.65) 100%)" }} />
        <div className="absolute bottom-6 left-6">
          <span className="px-3 py-1.5 rounded-full text-white" style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--primary)" }}>
            {article.category}
          </span>
        </div>
      </div>

      {/* ── Article content ── */}
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-16">

        {/* Title */}
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-muted-foreground mb-8" style={{ fontSize: "1.125rem", lineHeight: 1.7 }}>
          {article.excerpt}
        </p>

        {/* Author + meta */}
        <div className="flex flex-wrap items-center gap-5 pb-8 border-b border-border mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--primary)" }}>
                {article.author.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-muted-foreground" />
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{article.author}</span>
              </div>
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{article.authorRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              <span style={{ fontSize: "0.875rem" }}>{article.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span style={{ fontSize: "0.875rem" }}>{article.readTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye size={13} />
              <span style={{ fontSize: "0.875rem" }}>{views.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThumbsUp size={13} className="text-green-500" />
              <span style={{ fontSize: "0.875rem", color: "#16a34a" }}>{likes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThumbsDown size={13} className="text-red-400" />
              <span style={{ fontSize: "0.875rem", color: "#dc2626" }}>{dislikes}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <ArticleBody sections={article.body} />

        {/* ── Like / Dislike ── */}
        <div className="mt-10 py-8 border-t border-b border-border text-center">
          <p style={{ fontWeight: 700, fontSize: "1rem" }}>Was this article helpful?</p>
          <p className="text-muted-foreground mt-1 mb-5" style={{ fontSize: "0.875rem" }}>Your feedback helps us improve our content.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => vote("like")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border transition-all ${voted === "like" ? "bg-green-500 border-green-500 text-white" : "border-border bg-card hover:border-green-500/50 hover:text-green-600 text-muted-foreground"}`}
              style={{ fontWeight: 700, fontSize: "0.9375rem" }}
              aria-label="Like this article"
            >
              <ThumbsUp size={18} /> {likes.toLocaleString()}
            </button>
            <button
              onClick={() => vote("dislike")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border transition-all ${voted === "dislike" ? "bg-red-500 border-red-500 text-white" : "border-border bg-card hover:border-red-400/50 hover:text-red-500 text-muted-foreground"}`}
              style={{ fontWeight: 700, fontSize: "0.9375rem" }}
              aria-label="Dislike this article"
            >
              <ThumbsDown size={18} /> {dislikes.toLocaleString()}
            </button>
          </div>
          {voted && (
            <p className="mt-3 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              {voted === "like" ? "Thank you! Glad this resonated." : "Thank you — we'll take your feedback on board."}
            </p>
          )}
        </div>

        {/* ── Author card ── */}
        <div className="mt-14 pt-8 border-t border-border">
          <div className="flex items-start gap-4 bg-secondary rounded-2xl border border-primary/15 p-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--primary)" }}>
                {article.author.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{article.author}</p>
              <p className="text-primary mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{article.authorRole}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                {article.author === "Mariam Rashid"
                  ? "Mariam is a psychologist and relationship researcher at Ma3moni. She advises on the science of compatibility, communication, and long-term relationship health."
                  : "Layla is the CTO and co-founder of Ma3moni. She leads the compatibility algorithm and writes about the intersection of technology, psychology, and meaningful relationships."}
              </p>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-10 bg-primary rounded-2xl p-8 text-white text-center">
          <h3 style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            Ready to apply what you've read?
          </h3>
          <p className="opacity-80 mt-2 mb-6" style={{ fontSize: "1rem" }}>
            Ma3moni matches you based on the values, communication style, and goals you've just read about.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all"
            style={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Create Your Profile <ArrowRight size={17} />
          </button>
        </div>

        {/* ── Related articles ── */}
        <div className="mt-14">
          <h2 style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
            More from the Journal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {related.map(rel => (
              <button
                key={rel.id}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  if (onOpenArticle) {
                    onOpenArticle(rel.id);
                  } else {
                    const event = new CustomEvent("openArticle", { detail: rel.id });
                    window.dispatchEvent(event);
                  }
                }}
                className="text-left bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-md transition-all group"
              >
                <div className="overflow-hidden" style={{ height: "160px" }}>
                  <img src={rel.photo} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className="text-primary" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{rel.category}</span>
                  <h4 style={{ fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.4, marginTop: "0.25rem" }}>{rel.title}</h4>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                    <Clock size={11} />
                    <span style={{ fontSize: "0.75rem" }}>{rel.readTime}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
