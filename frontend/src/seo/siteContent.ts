// Single source of truth for crawlable SEO/AEO/GEO copy.
// Used by (1) React pages at runtime and (2) scripts/prerender-seo.mjs at build time, so the
// HTML that search and AI crawlers receive is the same content people see.
//
// Editorial rules (see the SEO brief): original wording only; no invented studies, ratings,
// credentials or validation claims; assessments are described as self-reflection tools, not
// clinical or standardized instruments. Facts that change per deployment (question count,
// price) come from the API and are omitted when unknown rather than guessed.

export const SITE_NAME = 'My Inner';
export const CONTENT_UPDATED = '2026-11-12';

export type Faq = { q: string; a: string };
export type TestContent = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  /** Direct 2–3 sentence answer to "what is this test?", shown first on the page. */
  answer: string;
  explores: string[];
  doesNot: string[];
  bestFor: string[];
  faqs: Faq[];
  relatedTests: string[];
  guides: string[];
};

const shared = {
  notClinical: 'It is not a diagnosis, clinical instrument or standardized psychological test, and it cannot replace advice from a qualified professional.'
};

export const testContent: Record<string, TestContent> = {
  'mbti-style': {
    slug: 'mbti-style',
    seoTitle: '16 Personality Types Test Online | My Inner',
    seoDescription: 'Take the 16 Personality Types Test online. Explore four personality dimensions and get a personal report on your type, strengths and how you relate to others.',
    answer: 'The 16 Personality Types Test is an original My Inner self-assessment that places your answers along four personality dimensions (extraversion–introversion, sensing–intuition, thinking–feeling and judging–perceiving) and results in one of 16 personality types. It is designed for self-reflection and personal growth. ' + shared.notClinical,
    explores: ['How you prefer to gain energy: from people and activity, or from quiet and reflection', 'How you take in information: concrete detail or patterns and possibilities', 'How you tend to make decisions: logic and objectivity or values and people', 'How you like to organise your life: structured and planned or flexible and spontaneous'],
    doesNot: ['It does not diagnose any condition or measure mental health', 'It is not a hiring, clinical or legal assessment', 'It does not predict your abilities, success or compatibility with other people', 'It is an original assessment inspired by well-known personality frameworks and is not affiliated with or endorsed by any other personality instrument or its owners'],
    bestFor: ['Anyone curious about their natural preferences and communication style', 'People reflecting on strengths, work style or relationships', 'Readers of personality-type content who want a structured starting point'],
    faqs: [
      { q: 'How many personality types are there in this test?', a: 'The test results in one of 16 types, formed by combining a preference on each of four dimensions: extraversion or introversion, sensing or intuition, thinking or feeling, and judging or perceiving.' },
      { q: 'Is this the same as the Myers-Briggs test?', a: 'No. It is an original My Inner assessment. The 16-type approach grew out of Carl Jung’s ideas about psychological types, but this test is independent and is not affiliated with or endorsed by the owners of any other personality instrument.' },
      { q: 'How accurate is an online personality test?', a: 'Short self-report tests reflect how you see yourself on the day you answer. They can be a useful prompt for reflection, but they are not precise measurements, and results can change with mood, context and honesty. Treat your type as a starting point, not a label.' },
      { q: 'Can I retake the test?', a: 'Yes, you can retake it from your account. Many people find their result is similar over time but not identical, especially if their situation has changed.' }
    ],
    relatedTests: ['five-love-languages', 'hidden-animal', 'cube-personality'],
    guides: ['how-do-personality-tests-work', 'sixteen-personality-types-vs-big-five']
  },
  'inner-child': {
    slug: 'inner-child',
    seoTitle: 'Inner Child Test: Self-Reflection Assessment | My Inner',
    seoDescription: 'Take the Inner Child Self-Reflection Test to explore emotional needs, self-worth and trust patterns from your past. For reflection only, not a clinical diagnosis.',
    answer: 'The Inner Child Self-Reflection Test is a My Inner assessment that invites you to reflect on emotional themes such as feeling safe, self-worth, expressing feelings, trusting others and resilience. “Inner child” is a popular self-help idea about the part of us shaped by early experiences; it is a metaphor, not a medical term. This test is for self-reflection only. ' + shared.notClinical,
    explores: ['How safe and supported you tend to feel emotionally', 'How you think about your own worth', 'How freely you express feelings and needs', 'How you approach trust and closeness', 'How you recover and keep going when things are hard'],
    doesNot: ['It does not diagnose trauma, anxiety, depression or any other condition', 'It is not therapy and does not replace support from a qualified mental health professional', 'It cannot tell you what happened in your childhood or why you feel as you do'],
    bestFor: ['People curious about how early experiences may still shape their reactions', 'Anyone who wants structured prompts for journaling or self-reflection', 'People who may later choose to discuss their reflections with a counsellor or therapist'],
    faqs: [
      { q: 'What is the inner child concept?', a: 'It is a metaphor popular in self-help and some therapy approaches for the emotional part of us that carries early experiences, needs and feelings. It is not a scientific measurement. Our guide explains the idea and its limits.' },
      { q: 'Is the Inner Child Test a diagnosis?', a: 'No. It is a self-reflection tool. It cannot diagnose any condition. If you are struggling or have experienced trauma, a qualified mental health professional can offer proper support.' },
      { q: 'What will I receive after taking it?', a: 'You will receive a written result in your My Inner account describing the themes that stood out in your answers, with reflections you can think about or write about.' },
      { q: 'What if the questions bring up difficult feelings?', a: 'You can stop at any time. If the test brings up distress, consider speaking with someone you trust or a qualified professional. If you are in immediate danger, contact your local emergency services.' }
    ],
    relatedTests: ['five-love-languages', 'mbti-style', 'cube-personality'],
    guides: ['what-is-the-inner-child-concept']
  },
  'five-love-languages': {
    slug: 'five-love-languages',
    seoTitle: 'Five Love Languages Test Online | My Inner',
    seoDescription: 'Take the Five Love Languages test online and discover how you prefer to give and receive love: words, time, service, gifts or touch. Personal result included.',
    answer: 'The Five Love Languages Test helps you reflect on how you prefer to give and receive affection across five categories: words of affirmation, quality time, acts of service, thoughtful gifts or gestures, and physical touch. The love-language framework was popularised by Gary Chapman; this test is an independent My Inner assessment. ' + shared.notClinical,
    explores: ['Words of affirmation: encouragement, appreciation and kind words', 'Quality time: undivided attention and shared experiences', 'Acts of service: practical help and thoughtful effort', 'Thoughtful gifts and gestures: symbolic care and remembering what matters', 'Physical touch: closeness, hugs and physical affection'],
    doesNot: ['It does not measure relationship quality or predict whether a relationship will last', 'It does not replace couples counselling or professional relationship advice', 'It is not affiliated with or endorsed by the author or publisher of the original love languages books'],
    bestFor: ['Anyone who wants words for how they feel cared for', 'Partners who want a friendly starting point for talking about needs', 'People reflecting on friendships and family relationships as well as romance'],
    faqs: [
      { q: 'What are the five love languages?', a: 'They are words of affirmation, quality time, acts of service, receiving gifts (thoughtful gifts or gestures) and physical touch. Most people value several, with one or two standing out.' },
      { q: 'Can I take the test for my partner?', a: 'The test is about your own preferences. You can compare results with a partner by both taking the test, but each person should answer honestly for themselves.' },
      { q: 'Are love languages scientifically proven?', a: 'The framework is widely used and many people find it a helpful conversation starter, but research testing its claims is limited. Use it as a tool for reflection and communication rather than as a rule about how relationships work.' },
      { q: 'Is my primary love language fixed?', a: 'Not necessarily. Preferences can shift with life stage, stress and the relationship itself, so retaking the test later can be informative.' }
    ],
    relatedTests: ['inner-child', 'mbti-style', 'hidden-animal'],
    guides: ['the-five-love-languages-explained']
  },
  'hidden-animal': {
    slug: 'hidden-animal',
    seoTitle: 'Hidden Animal Personality Test | My Inner',
    seoDescription: 'Find out which animal matches your personality with the Hidden Animal Test. A playful, reflective quiz with a personal result, made for fun and self-reflection.',
    answer: 'The Hidden Animal Test is a playful My Inner personality experience that matches your answers to an animal archetype, along with traits, strengths and ways you handle challenge and change. It is made for entertainment and self-reflection and is not a scientific or diagnostic instrument.',
    explores: ['Which animal archetype best fits your answers', 'Traits and strengths associated with your result', 'How you tend to respond to challenge and change'],
    doesNot: ['It is not a scientifically validated personality measure', 'It does not diagnose or predict anything about you', 'Your result is a creative reflection, not a statement of fact about who you are'],
    bestFor: ['People who enjoy playful, symbolic self-discovery', 'Anyone looking for a light, shareable way to think about their personality', 'Readers curious about animal personality or spirit-animal style quizzes'],
    faqs: [
      { q: 'Is the Hidden Animal Test scientific?', a: 'No. It is an entertainment and self-reflection experience. Animal archetypes are a creative way to talk about traits, not a validated psychological measure.' },
      { q: 'Is this the same as a spirit animal quiz?', a: 'It is similar in spirit: your answers map to an animal that represents certain traits. It is not connected to any religious or cultural spiritual practice.' },
      { q: 'Can I share my result?', a: 'Yes, many people enjoy comparing results with friends. Remember that it is meant to be playful rather than definitive.' }
    ],
    relatedTests: ['cube-personality', 'mbti-style', 'inner-child'],
    guides: ['symbolic-personality-tests-for-reflection']
  },
  'cube-personality': {
    slug: 'cube-personality',
    seoTitle: 'Cube Personality Test: Symbolic Self-Reflection | My Inner',
    seoDescription: 'Imagine a cube, a ladder, a horse, flowers and a storm. Take the Cube Personality Test for a symbolic self-reflection result about self-image, relationships and resilience.',
    answer: 'The Cube Personality Test is a symbolic self-reflection exercise. You imagine a cube, a ladder, a horse, flowers and a storm, and your answers are interpreted across four themes: self-image, relationships, love outlook and resilience. It is a creative prompt for reflection, not a scientifically proven psychological test.',
    explores: ['How you see yourself (self-image)', 'How you approach relationships', 'Your outlook on love', 'How you think about resilience and difficult moments'],
    doesNot: ['It is not a validated psychological or clinical test', 'It cannot reveal hidden traits or predict behaviour', 'Symbolic interpretations are prompts for thought, not facts'],
    bestFor: ['People who enjoy imaginative, symbolic exercises', 'Anyone who wants a short reflective activity rather than a long questionnaire', 'Readers who have seen the cube or ladder personality test online and want a structured version'],
    faqs: [
      { q: 'What is the cube personality test?', a: 'It is an imaginative exercise in which you picture a cube, a ladder, a horse, flowers and a storm and describe what you see. The details you choose are then interpreted as symbolic reflections of how you view yourself and your life.' },
      { q: 'Is the cube test accurate?', a: 'It is not a scientifically validated test. Symbolic exercises like this work best as prompts for self-reflection and conversation rather than as accurate measurements.' },
      { q: 'How long does it take?', a: 'It is one of the shorter My Inner assessments, and most people finish within several minutes.' }
    ],
    relatedTests: ['hidden-animal', 'mbti-style', 'inner-child'],
    guides: ['symbolic-personality-tests-for-reflection']
  }
};

export const publicTestSlugs = Object.keys(testContent);

export type GuideSection = { heading: string; paragraphs: string[]; bullets?: string[] };
export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  /** Direct answer shown at the top (AEO). */
  summary: string;
  sections: GuideSection[];
  faqs?: Faq[];
  further?: string[];
  tests: string[];
  related: string[];
};

export const guides: Guide[] = [
  {
    slug: 'how-do-personality-tests-work',
    title: 'How do personality tests work, and how accurate are they?',
    seoTitle: 'How Do Personality Tests Work? Accuracy Explained | My Inner',
    description: 'A plain-language guide to how personality tests are built, what their results mean, how accurate online personality tests are, and how to use your result well.',
    summary: 'Most personality tests ask you to rate how well statements describe you, then add up your answers into scores on a few traits or into a type. They describe how you see yourself, not a fixed truth. Well-built tests can be reliable, but many online quizzes are not validated, so treat results as a prompt for reflection rather than a verdict.',
    sections: [
      { heading: 'What a personality test actually measures', paragraphs: ['A personality test is a structured set of questions. You answer by choosing how much you agree with statements or by picking between options, and a scoring system turns those answers into a result. This is called self-report: the test records what you say about yourself, not what you do.', 'Because it is self-report, the result is shaped by how well you know yourself, how honest you are, and even your mood on the day.'] },
      { heading: 'Traits and types: two common ways to report results', paragraphs: ['Some tests score you on traits, such as how high or low you are on a spectrum like openness or agreeableness. Others sort you into a type, such as one of 16 personality types, based on which side of several dimensions you lean toward.', 'Trait models treat people as varying along continuums. Type models are easier to remember and share but can hide the fact that many people sit near the middle of a dimension.'] },
      { heading: 'Reliability and validity in simple terms', paragraphs: ['Psychologists judge a test by two ideas. Reliability asks whether the test gives similar results when you retake it. Validity asks whether it measures what it claims to measure and predicts anything useful.', 'A test developed and checked against evidence can be reasonably reliable and valid for its stated purpose. A quiz written for fun usually has not been checked in this way, which is why its result should not be treated as scientific.'] },
      { heading: 'How accurate are online personality tests?', paragraphs: ['Accuracy varies widely. A result can feel very accurate for several reasons that have nothing to do with measurement quality. One is the Barnum or Forer effect: people tend to accept general, flattering descriptions as personal. Bertram Forer demonstrated this in a classroom study in 1949.', 'A practical rule: the more a test claims to diagnose, predict or label you, the more cautious you should be. Tests that are open about being for reflection and about their limits are easier to trust.'] },
      { heading: 'How to use your result well', paragraphs: ['Use a result as a conversation starter with yourself. Notice which statements feel true, which feel off, and why.'], bullets: ['Answer based on how you usually are, not how you want to be or how you feel today', 'Look for patterns you recognise rather than accepting every line', 'Retake after a big life change and compare', 'Never use a casual quiz for hiring, medical or legal decisions', 'Speak to a qualified professional about mental health concerns; a quiz cannot assess them'] }
    ],
    faqs: [
      { q: 'Can a personality test be wrong?', a: 'Yes. Results depend on your honesty, mood and self-knowledge, and on how well the test was built. A result is best treated as one perspective, not a final answer.' },
      { q: 'Do personality types change?', a: 'Many traits are fairly stable in adulthood but can shift gradually with age, experience and effort. A retest may give a similar but not identical result.' }
    ],
    further: ['Forer, B. R. (1949). The fallacy of personal validation: A classroom demonstration of gullibility. Journal of Abnormal and Social Psychology, 44(1), 118–123.'],
    tests: ['mbti-style', 'cube-personality'],
    related: ['sixteen-personality-types-vs-big-five', 'symbolic-personality-tests-for-reflection']
  },
  {
    slug: 'sixteen-personality-types-vs-big-five',
    title: '16 personality types vs the Big Five: what is the difference?',
    seoTitle: '16 Personality Types vs Big Five: Key Differences | My Inner',
    description: 'Compare the 16 personality types model with the Big Five (OCEAN) trait model: how each works, how results are reported, and when to use which.',
    summary: 'The 16 personality types model sorts people into one of 16 categories based on four either/or preferences. The Big Five describes personality as five continuous traits: openness, conscientiousness, extraversion, agreeableness and neuroticism (often shortened to OCEAN). Researchers generally favour the Big Five, while the 16-type approach is popular for its simple, memorable categories.',
    sections: [
      { heading: 'The 16 personality types approach', paragraphs: ['The 16-type approach grew out of Carl Jung’s theory of psychological types and was developed into a questionnaire by Katharine Briggs and Isabel Briggs Myers. It describes four dimensions: extraversion or introversion, sensing or intuition, thinking or feeling, and judging or perceiving. Your combination of preferences gives a four-letter type.', 'Its strength is accessibility: types are easy to remember, discuss and apply to communication and teamwork.'] },
      { heading: 'The Big Five (OCEAN) approach', paragraphs: ['The Big Five, also called the five-factor model, comes from decades of research that grouped descriptions of personality into five broad traits.'], bullets: ['Openness: curiosity and interest in new ideas and experiences', 'Conscientiousness: organisation, reliability and self-discipline', 'Extraversion: sociability and energy in social settings', 'Agreeableness: cooperation, trust and consideration of others', 'Neuroticism: tendency to experience stress and negative emotion'] },
      { heading: 'Key differences', paragraphs: ['Type versus trait is the main difference. The 16-type model puts you in a category; the Big Five gives you a position on each of five scales. Most people sit somewhere in the middle of many scales, which a category can hide.', 'The Big Five is also more widely used in academic research, while the 16-type model is more common in popular self-development and workshops.'] },
      { heading: 'Which should you use?', paragraphs: ['If you want an easy-to-discuss framework for self-reflection, the 16-type model can be a useful starting point. If you want a model with more research behind it, look at the Big Five. Either way, treat results as descriptions of preferences and tendencies, not as fixed labels or predictions.'] }
    ],
    faqs: [
      { q: 'Is the Big Five more scientific than 16 personality types?', a: 'The Big Five is generally preferred in academic personality research because it treats traits as continuous and has been studied extensively. The 16-type model is popular but is more often criticised by researchers.' },
      { q: 'Can I use both?', a: 'Yes. Many people find the 16 types easier to talk about and the Big Five more nuanced. They describe personality in different ways, so results will not map perfectly onto each other.' }
    ],
    further: ['Jung, C. G. (1921). Psychologische Typen.', 'Myers, I. B., with Myers, P. B. (1980). Gifts Differing. Consulting Psychologists Press.', 'Costa, P. T., & McCrae, R. R. (1992). Revised NEO Personality Inventory (NEO-PI-R) and NEO Five-Factor Inventory (NEO-FFI) professional manual. Psychological Assessment Resources.'],
    tests: ['mbti-style'],
    related: ['how-do-personality-tests-work']
  },
  {
    slug: 'the-five-love-languages-explained',
    title: 'The five love languages explained',
    seoTitle: 'The Five Love Languages Explained | My Inner',
    description: 'What the five love languages are, how to recognise yours, how couples can use the idea, and what research does and does not say about it.',
    summary: 'The five love languages are words of affirmation, quality time, acts of service, receiving gifts and physical touch. The idea, popularised by Gary Chapman in 1992, is that people tend to feel most cared for in particular ways. It is a popular communication tool, though research supporting its specific claims is limited.',
    sections: [
      { heading: 'The five languages', paragraphs: ['Each language describes a way of giving or receiving care.'], bullets: ['Words of affirmation: spoken or written appreciation, encouragement and kindness', 'Quality time: focused attention and shared experiences without distraction', 'Acts of service: doing something helpful that eases the other person’s load', 'Receiving gifts: thoughtful gifts or gestures that show you were remembered', 'Physical touch: hugs, holding hands and other physical closeness'] },
      { heading: 'How to notice your own', paragraphs: ['Think about moments when you felt most cared for, and about what you tend to do for others. Often we give care in the way we want to receive it. Another clue is what hurts most when it is missing: a forgotten date, a lack of attention, an unshared chore load or a missing hug.'] },
      { heading: 'Using the idea in a relationship', paragraphs: ['The most useful part of the framework is the conversation it starts. Ask each other what makes you feel appreciated, and be specific. Small, repeated actions in your partner’s preferred style often matter more than occasional grand gestures.', 'Love languages apply beyond romance: they can help with friendships, family and even teamwork.'] },
      { heading: 'Common misunderstandings', paragraphs: ['Love languages are not personality types, and nobody belongs to exactly one. They also do not mean you can ignore the basics of a healthy relationship, such as respect, honesty and shared responsibility. A person who says their language is “quality time” still needs reliability and kindness in every other area.', 'It also helps to remember that a stated preference describes what feels good, not what a partner owes you. The framework works best when both people use it to ask questions and stay curious, rather than to keep score.'] },
      { heading: 'What research says', paragraphs: ['Love languages are widely discussed, but scientific testing of the framework’s claims is limited, and some researchers have questioned whether matching a partner’s language predicts higher relationship satisfaction. Many people nonetheless find it a friendly, practical way to talk about needs. Use it as a tool for communication, not as a rule or a diagnosis of a relationship.'] }
    ],
    faqs: [
      { q: 'Can you have more than one love language?', a: 'Yes. Most people value several languages and have one or two that stand out. Preferences can change over time.' },
      { q: 'Who created the five love languages?', a: 'Gary Chapman, a US author and counsellor, introduced the framework in his 1992 book The Five Love Languages.' }
    ],
    further: ['Chapman, G. (1992). The Five Love Languages. Northfield Publishing.'],
    tests: ['five-love-languages'],
    related: ['what-is-the-inner-child-concept']
  },
  {
    slug: 'what-is-the-inner-child-concept',
    title: 'What is the inner child concept?',
    seoTitle: 'What Is the Inner Child? Meaning and Limits | My Inner',
    description: 'A clear introduction to the inner child concept: what it means, where the idea comes from, how people use it for self-reflection, and what it cannot do.',
    summary: 'The inner child is a metaphor from psychology and self-help for the part of us that carries feelings, needs and memories from early life. People use the idea to understand why they react as they do and to practise self-compassion. It is not a medical diagnosis, and it is not a replacement for therapy.',
    sections: [
      { heading: 'What does “inner child” mean?', paragraphs: ['“Inner child” describes the emotional side of us that still holds childhood experiences, needs and feelings. Many people use it as a way to talk about patterns such as being very self-critical, struggling to ask for help or feeling uneasy when others get close.', 'The phrase is a figure of speech. There is no physical or scientific “inner child”; it is a helpful picture for some people and unhelpful for others.'] },
      { heading: 'Where the idea comes from', paragraphs: ['Carl Jung wrote about a “child archetype” in the first half of the twentieth century. The phrase became widely popular through self-help writing in the late 1980s and 1990s, including books by Charles Whitfield and John Bradshaw, and has since been adopted in counselling, journaling and mindfulness practices.'] },
      { heading: 'How people use it for reflection', paragraphs: ['Common reflective practices include writing a letter to your younger self, noticing when a strong reaction feels bigger than the situation, and asking what a younger version of you would have needed. The goal is usually greater self-understanding and kindness toward yourself.'] },
      { heading: 'Gentle ways to reflect', paragraphs: ['If the idea appeals to you, keep it simple and kind. You do not need to uncover anything dramatic for it to be worthwhile.'], bullets: ['Write down what you needed to hear as a child and say it to yourself now', 'Notice which situations trigger reactions that feel bigger than the moment, and note what they have in common', 'Look at an old photo and write a few sentences of kindness to the person in it', 'Pause before criticising yourself and ask whether you would speak that way to a child you care about'] },
      { heading: 'What it cannot do', paragraphs: ['Inner child work is not a treatment. It cannot diagnose trauma, anxiety or any other condition. If thinking about your past brings up intense distress, or if you are struggling to function, a qualified mental health professional can help. If you are in immediate danger, contact your local emergency services.'] }
    ],
    faqs: [
      { q: 'Is inner child work scientifically proven?', a: 'The inner child is a metaphor rather than a tested scientific construct. Some therapies use related ideas, and many people find reflective exercises helpful, but it should not be treated as a proven treatment.' },
      { q: 'Can an online inner child test diagnose me?', a: 'No. An online test can offer prompts for reflection but cannot diagnose anything. Speak to a qualified professional if you have concerns about your wellbeing.' }
    ],
    further: ['Bradshaw, J. (1990). Homecoming: Reclaiming and Championing Your Inner Child. Bantam Books.', 'Whitfield, C. L. (1987). Healing the Child Within. Health Communications.'],
    tests: ['inner-child'],
    related: ['the-five-love-languages-explained']
  },
  {
    slug: 'symbolic-personality-tests-for-reflection',
    title: 'Symbolic and animal personality tests: fun, reflection and their limits',
    seoTitle: 'Cube, Animal and Symbolic Personality Tests Explained | My Inner',
    description: 'How symbolic personality tests such as the cube test and animal or spirit-animal quizzes work, why people enjoy them, and why they should be treated as reflection, not science.',
    summary: 'Symbolic personality tests ask you to imagine objects or choose animals, then interpret your choices as clues about how you see yourself. They are creative and often enjoyable, but they are not scientifically validated, so they work best as prompts for reflection and conversation.',
    sections: [
      { heading: 'How symbolic tests work', paragraphs: ['In a symbolic test you may imagine a scene, such as a cube in a desert with a ladder, a horse, flowers and a storm, and describe what you picture. Each element is treated as a symbol for part of life, such as self-image, relationships or hardship. Animal and spirit-animal quizzes work similarly, matching answers to an animal that stands for certain traits.'] },
      { heading: 'Why people enjoy them', paragraphs: ['They are short, imaginative and easy to share. They also invite you to describe your own thoughts instead of choosing from rating scales, which can feel more personal.'] },
      { heading: 'Why they are not science', paragraphs: ['The interpretations are not based on tested evidence that a particular image reveals a particular trait. People also tend to find meaning in general descriptions that could apply to many people. For both reasons, a symbolic result cannot reliably measure personality, predict behaviour or diagnose anything.'] },
      { heading: 'Questions to ask about any symbolic result', paragraphs: ['A result becomes useful when you question it instead of simply accepting or rejecting it. Try asking yourself:'], bullets: ['Which lines feel true to me, and what experience do I connect them with?', 'Which lines feel wrong, and what does that tell me about how I see myself?', 'Would a close friend describe me the same way?', 'Is there one idea here I would like to think or write about further?'] },
      { heading: 'Using them well', paragraphs: ['Take them for fun and for the thinking they spark. Ask whether the interpretation resonates, why, and what you might want to explore further. For a more structured look at your preferences, a questionnaire-based personality assessment may suit you better.'] }
    ],
    faqs: [
      { q: 'Is the cube personality test real?', a: 'The exercise is real in the sense that it exists and is widely shared, but its interpretations are not scientifically validated. Treat it as a creative reflection prompt.' },
      { q: 'Are animal personality quizzes accurate?', a: 'They are entertaining ways to think about traits, but they are not accurate measurements of personality.' }
    ],
    tests: ['cube-personality', 'hidden-animal'],
    related: ['how-do-personality-tests-work']
  }
];

export const guideBySlug = (slug: string) => guides.find((guide) => guide.slug === slug);

/** Titles/descriptions for non-test public pages. Shared by the client and the build-time prerenderer. */
export const staticSeo: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Online Personality & Self-Discovery Tests | My Inner',
    description: 'Take online personality, relationship and self-discovery tests from My Inner: 16 personality types, love languages, inner child and more, each with a personal result.'
  },
  '/tests': {
    title: 'Personality & Self-Discovery Tests Online | My Inner',
    description: 'Browse My Inner’s online self-discovery tests: 16 personality types, five love languages, inner child, cube and hidden animal. Compare each test and see what you get.'
  },
  '/about': {
    title: 'About My Inner | Self-Discovery & Personal Growth',
    description: 'Learn about My Inner and our approach to self-discovery, personal growth and thoughtful self-reflection assessments.'
  },
  '/terms': {
    title: 'Terms of Service | My Inner',
    description: 'Read the My Inner terms of service for using our self-discovery assessment platform.'
  },
  '/guides': {
    title: 'Personality & Self-Discovery Guides | My Inner',
    description: 'Plain-language guides on how personality tests work, 16 personality types vs the Big Five, the five love languages, the inner child concept and symbolic tests.'
  }
};

export const homeFaqs: Faq[] = [
  { q: 'What is My Inner?', a: 'My Inner is a website of online self-discovery assessments covering personality, relationships and emotional reflection. Each test gives you a personal written result in your account.' },
  { q: 'Are My Inner tests scientifically validated or clinical?', a: 'No. My Inner tests are designed for self-reflection and personal growth. They are not clinical, diagnostic or standardized psychological instruments and do not replace professional advice.' },
  { q: 'How much do the tests cost?', a: 'Each test is priced individually. The current price is shown on each test page before you buy.' },
  { q: 'How long does a test take?', a: 'Most tests take roughly 10 to 25 minutes, depending on the test and how long you spend on each question.' },
  { q: 'Are my answers and results private?', a: 'Your results are saved to your account and are not publicly visible. See our terms for details.' }
];

export const absoluteUrl = (siteUrl: string, path: string) => `${siteUrl.replace(/\/$/, '')}${path === '/' ? '/' : path}`;

export function breadcrumbJsonLd(siteUrl: string, trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(siteUrl, item.path) }))
  };
}

export function guideJsonLd(siteUrl: string, guide: Guide) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      mainEntityOfPage: absoluteUrl(siteUrl, `/guides/${guide.slug}`),
      datePublished: CONTENT_UPDATED,
      dateModified: CONTENT_UPDATED,
      author: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl(siteUrl, '/') },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl(siteUrl, '/'), logo: { '@type': 'ImageObject', url: `${siteUrl.replace(/\/$/, '')}/logo-512.png` } },
      image: `${siteUrl.replace(/\/$/, '')}/og-image.jpg`
    },
    breadcrumbJsonLd(siteUrl, [{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }, { name: guide.title, path: `/guides/${guide.slug}` }])
  ];
}
