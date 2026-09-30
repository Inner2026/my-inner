**My Inner --- Testing Platform Specification**

*Fully deterministic, answer-based scoring --- no AI involved in
calculating, generating, or interpreting results.*

1\. PLATFORM OVERVIEW

My Inner is an online self-discovery and personality testing platform.

Users can create an account using email or phone number, select an
individual test, pay \$4.99 USD per test, complete the test, receive an
automatically calculated result based solely on their own answers, and
save/access previous results.

**Initial tests:**

> 1\. MBTI Personality Test
>
> 2\. Inner Child Test
>
> 3\. Five Love Languages Test
>
> 4\. IQ / Cognitive Reasoning Test
>
> 5\. Spirit Animal / Mythical Animal Personality Test
>
> 6\. Cube Personality Test
>
> 7\. Relationship / Compatibility Test

The platform must use a reusable testing engine so additional tests can
be added later without rebuilding the core system.

2\. SCORING ENGINE --- FULLY DETERMINISTIC, NO AI

The platform must use a fully deterministic, rules-based scoring system.
No AI model is used anywhere in the platform --- not to calculate
scores, not to generate a result, and not to write or personalize any
result text.

**BACKEND SCORING ENGINE:**

The backend receives the user\'s answers, applies predefined scoring
rules, calculates numerical/category scores, determines the score range
or ranking, matches that outcome to a final result, looks up the
pre-written description that belongs to that result, and saves the
answers, scores and result. The backend is the sole source of truth ---
there is no separate interpretation step performed by anything else.

**PREDEFINED RESULT DESCRIPTIONS:**

Every possible result (a personality type, a score range, a category
ranking, a combination of traits) is linked ahead of time to a fixed,
pre-written description stored in the database by an administrator. When
a user finishes a test, the system simply looks up and displays the
description that matches their calculated result. No text is generated
dynamically for any user.

3\. COMPLETE SYSTEM FLOW

USER LOGIN → SELECT TEST → PAY \$4.99 → START TEST → ANSWER QUESTIONS →
SUBMIT → BACKEND SCORING ENGINE → RAW/CATEGORY SCORES → FINAL RESULT →
MATCH TO PREDEFINED RESULT DESCRIPTION → SAVE SCORES → DISPLAY RESULT →
SAVE TO ACCOUNT

4\. TEST 1 --- MBTI-STYLE PERSONALITY TEST

Purpose: A My Inner MBTI-style self-discovery assessment based on:

-   Extraversion (E) vs Introversion (I)

-   Sensing (S) vs Intuition (N)

-   Thinking (T) vs Feeling (F)

-   Judging (J) vs Perceiving (P)

It produces one of 16 personality profiles. It should be described as an
MBTI-style assessment, not the official proprietary MBTI assessment.

**Answer options:**

> 1\. Strongly Disagree
>
> 2\. Disagree
>
> 3\. Neutral
>
> 4\. Agree
>
> 5\. Strongly Agree

MBTI Questions

Q1. I feel energized after spending time with a large group of people.
--- E

Q2. I usually need time alone to recharge after social activities. --- I

Q3. I enjoy starting conversations with strangers. --- E

Q4. I prefer having a small number of close relationships rather than
many casual ones. --- I

Q5. I often think out loud when solving a problem. --- E

Q6. I prefer thinking through my ideas privately before discussing them.
--- I

Q7. I enjoy being at the center of social activity. --- E

Q8. I can spend an entire day alone and feel completely comfortable. ---
I

Q9. I naturally introduce myself to new people. --- E

Q10. I prefer observing a situation before becoming actively involved.
--- I

Q11. I tend to communicate my thoughts immediately. --- E

Q12. I need personal space even when I enjoy someone\'s company. --- I

Q13. Social interaction usually gives me additional energy. --- E

Q14. I prefer deep conversations with one person over group
conversations. --- I

Q15. I enjoy spontaneous social invitations. --- E

Q16. I become mentally tired after too much social interaction. --- I

Q17. I easily express my thoughts verbally. --- E

Q18. I often keep my strongest thoughts to myself. --- I

Q19. I enjoy meeting completely new groups of people. --- E

Q20. I prefer familiar environments and familiar people. --- I

Q21. I am comfortable speaking in front of a group. --- E

Q22. I would rather communicate privately than address a large group.
--- I

Q23. I usually seek interaction when I am bored. --- E

Q24. When stressed, I often withdraw to process things alone. --- I

Q25. I pay close attention to practical details. --- S

Q26. I naturally think about future possibilities. --- N

Q27. I trust information that can be directly observed. --- S

Q28. I often imagine how things could become different in the future.
--- N

Q29. I prefer clear instructions. --- S

Q30. I enjoy exploring theories and abstract ideas. --- N

Q31. I focus more on what is happening now than what might happen later.
--- S

Q32. I frequently notice patterns that connect seemingly unrelated
ideas. --- N

Q33. I prefer practical solutions to theoretical discussions. --- S

Q34. I enjoy imagining possibilities that have not yet been tested. ---
N

Q35. I remember specific facts and details easily. --- S

Q36. I often focus on the overall meaning rather than individual
details. --- N

Q37. I prefer experience over speculation. --- S

Q38. I am fascinated by ideas about what could happen. --- N

Q39. I usually follow proven methods. --- S

Q40. I enjoy creating new approaches even when proven methods exist. ---
N

Q41. I notice small changes in my surroundings. --- S

Q42. I tend to think about hidden meanings. --- N

Q43. I prefer realistic goals. --- S

Q44. I frequently imagine ambitious future possibilities. --- N

Q45. I like information presented in a concrete way. --- S

Q46. Metaphors and conceptual explanations appeal to me. --- N

Q47. I prefer dealing with facts before forming conclusions. --- S

Q48. I often reach conclusions by connecting ideas rather than examining
every detail. --- N

Q49. When making decisions, I prioritize logic over personal feelings.
--- T

Q50. I consider how decisions will emotionally affect people. --- F

Q51. I prefer honest criticism even when it is uncomfortable. --- T

Q52. I naturally try to protect people from unnecessary emotional
discomfort. --- F

Q53. I believe fairness sometimes requires applying the same rules to
everyone. --- T

Q54. I believe fairness sometimes requires considering each person\'s
circumstances. --- F

Q55. I analyze a problem objectively before considering emotions. --- T

Q56. I instinctively consider people\'s feelings when solving problems.
--- F

Q57. I value competence highly when evaluating someone. --- T

Q58. I value kindness highly when evaluating someone. --- F

Q59. I am comfortable making unpopular decisions when they are logically
justified. --- T

Q60. I dislike making decisions that could seriously hurt someone\'s
feelings. --- F

Q61. I enjoy debating ideas even when there is disagreement. --- T

Q62. I prefer conversations that maintain emotional harmony. --- F

Q63. I separate personal feelings from objective decisions. --- T

Q64. I find it difficult to ignore someone\'s emotional circumstances.
--- F

Q65. I tend to ask, \"Does this make sense?\" --- T

Q66. I tend to ask, \"How will this affect people?\" --- F

Q67. I value truth even when it is uncomfortable. --- T

Q68. I sometimes soften the truth to avoid unnecessary pain. --- F

Q69. Logical consistency is very important to me. --- T

Q70. Maintaining interpersonal harmony is very important to me. --- F

Q71. I like having a clear plan. --- J

Q72. I prefer keeping my options open. --- P

Q73. I feel satisfied when tasks are completed early. --- J

Q74. I often work best when deadlines are approaching. --- P

Q75. I like knowing what my schedule will look like. --- J

Q76. I enjoy spontaneous changes to my plans. --- P

Q77. I prefer making decisions and moving forward. --- J

Q78. I prefer waiting until I have more information before deciding. ---
P

Q79. I keep my environment organized. --- J

Q80. My environment can become disorganized while I focus on other
things. --- P

Q81. I enjoy creating schedules. --- J

Q82. Strict schedules can feel restrictive. --- P

Q83. I prefer finishing one project before starting another. --- J

Q84. I often have several projects or interests at the same time. --- P

Q85. I like predictable routines. --- J

Q86. I enjoy changing my routine. --- P

Q87. I usually make decisions relatively quickly. --- J

Q88. I often reconsider decisions after making them. --- P

Q89. I like knowing exactly what is expected of me. --- J

Q90. I prefer flexibility in how I complete tasks. --- P

Q91. I feel uncomfortable leaving important decisions unresolved. --- J

Q92. I am comfortable waiting and seeing how circumstances develop. ---
P

Q93. I feel more relaxed when my responsibilities are organized. --- J

MBTI Backend Scoring

For each question, convert the 1--5 response into a weighted value:

-   Strongly Disagree = -2

-   Disagree = -1

-   Neutral = 0

-   Agree = +1

-   Strongly Agree = +2

For questions supporting the opposite pole, reverse the direction.

Calculate E, I, S, N, T, F, J and P totals and normalize to percentages.

**Example:**

-   E 38%, I 62%

-   S 29%, N 71%

-   T 36%, F 64%

-   J 55%, P 45%

Final result: INFJ.

The backend determines INFJ purely from the calculated percentages, and
displays the predefined description written for the INFJ result. No AI
is involved in determining or wording this result.

5\. TEST 2 --- INNER CHILD SELF-REFLECTION TEST

Purpose: Explore emotional and self-reflection patterns. This is NOT a
clinical diagnosis.

**Categories:**

-   Abandonment Sensitivity

-   Emotional Suppression

-   Approval Seeking

-   Boundaries

-   Self-Worth

-   Trust

-   Emotional Security

**Answer scale:**

-   1 = Never

-   2 = Rarely

-   3 = Sometimes

-   4 = Often

-   5 = Almost Always

**Questions:**

> 1\. I worry that people I love may leave me.
>
> 2\. I find it difficult to ask for emotional support.
>
> 3\. I need reassurance that people still care about me.
>
> 4\. I feel responsible for other people\'s emotions.
>
> 5\. I find it difficult to say no.
>
> 6\. I hide my emotions to avoid becoming a burden.
>
> 7\. Criticism affects me more than I would like.
>
> 8\. I feel that I need to prove my worth.
>
> 9\. I become anxious when someone becomes emotionally distant.
>
> 10\. I find it difficult to trust people completely.
>
> 11\. I sometimes feel that my needs are less important than everyone
> else\'s.
>
> 12\. I feel guilty when I prioritize myself.
>
> 13\. I fear disappointing people.
>
> 14\. I sometimes avoid conflict because I fear rejection.
>
> 15\. I find it difficult to express anger in a healthy way.
>
> 16\. I often seek approval before making important decisions.
>
> 17\. I have difficulty accepting compliments.
>
> 18\. I sometimes feel emotionally younger than my actual age.
>
> 19\. I worry about being misunderstood.
>
> 20\. I find it difficult to relax when relationships feel uncertain.
>
> 21\. I am afraid of making mistakes.
>
> 22\. I sometimes feel that I must be strong for everyone else.
>
> 23\. I struggle to identify what I actually need emotionally.
>
> 24\. I sometimes withdraw when I feel hurt.
>
> 25\. I have difficulty setting boundaries.
>
> 26\. I overthink situations where someone\'s behavior changes.
>
> 27\. I sometimes blame myself when relationships go wrong.
>
> 28\. I find it difficult to believe that I deserve love without
> earning it.
>
> 29\. I am afraid of becoming too emotionally dependent on someone.
>
> 30\. I want to feel accepted exactly as I am.

**Scoring:**

-   1 = 0 points

-   2 = 1 point

-   3 = 2 points

-   4 = 3 points

-   5 = 4 points

Maximum = 120.

**Result ranges:**

-   0--24 = Secure Emotional Foundation

-   25--48 = Mild Emotional Sensitivity

-   49--72 = Unresolved Emotional Patterns

-   73--96 = Strong Emotional Sensitivity

-   97--120 = Deep Emotional Sensitivity

The backend calculates the total score and category scores, matches the
total to the correct range, and displays the predefined description text
written for that range. No AI is used to generate or personalize this
text.

6\. TEST 3 --- FIVE LOVE LANGUAGES

**Categories:**

-   Words of Affirmation

-   Acts of Service

-   Receiving Gifts

-   Quality Time

-   Physical Touch

**Answer scale:**

-   1 = Not important to me

-   2 = Slightly important

-   3 = Moderately important

-   4 = Very important

-   5 = Extremely important

**Questions:**

> 1\. Hearing my partner say they appreciate me is important to me. ---
> Words
>
> 2\. I feel loved when someone helps me with something difficult. ---
> Acts
>
> 3\. Receiving a thoughtful gift makes me feel special. --- Gifts
>
> 4\. I value uninterrupted time together. --- Time
>
> 5\. Physical affection makes me feel emotionally connected. --- Touch
>
> 6\. Compliments make me feel appreciated. --- Words
>
> 7\. I appreciate it when someone takes care of a task for me. --- Acts
>
> 8\. A surprise present can make me feel deeply cared for. --- Gifts
>
> 9\. I prefer spending meaningful time together over receiving
> presents. --- Time
>
> 10\. Holding hands makes me feel close to someone. --- Touch
>
> 11\. I like hearing encouraging words from people I love. --- Words
>
> 12\. I feel loved when someone notices what needs to be done and does
> it. --- Acts
>
> 13\. I appreciate gifts that show someone knows my preferences. ---
> Gifts
>
> 14\. Having someone\'s full attention makes me feel valued. --- Time
>
> 15\. Physical closeness is important in my relationships. --- Touch
>
> 16\. I remember meaningful things people say to me. --- Words
>
> 17\. Practical support means a lot to me. --- Acts
>
> 18\. I treasure sentimental gifts. --- Gifts
>
> 19\. I would rather have a meaningful conversation than receive a
> material gift. --- Time
>
> 20\. A hug can communicate more to me than words. --- Touch
>
> 21\. I feel encouraged when someone verbally recognizes my efforts.
> --- Words
>
> 22\. I appreciate when someone makes my life easier. --- Acts
>
> 23\. I enjoy receiving unexpected thoughtful items. --- Gifts
>
> 24\. I feel closest to people when we experience things together. ---
> Time
>
> 25\. Physical affection helps me feel emotionally secure. --- Touch

**Scoring:**

Add the five answers in each category. Maximum per category = 25.

**Example:**

-   Words 21/25

-   Acts 17/25

-   Gifts 11/25

-   Time 23/25

-   Touch 19/25

Primary = highest score. Secondary = second highest score.

The backend calculates all five totals and determines the ranking, then
displays the predefined description written for that primary/secondary
combination. No AI is used to explain or personalize the ranking.

7\. TEST 4 --- COGNITIVE REASONING / IQ-STYLE TEST

This should be presented as a My Inner Cognitive Reasoning Test, not an
officially standardized IQ examination unless a validated instrument and
authorized scoring conversion are separately implemented.

**Areas:**

-   Numerical reasoning

-   Logical reasoning

-   Pattern recognition

-   Verbal reasoning

-   Spatial reasoning

**Questions:**

Q1. 2, 4, 8, 16, ? A)20 B)24 C)32 D)36 --- Correct C

Q2. 3, 6, 12, 24, ? A)36 B)42 C)48 D)54 --- Correct C

Q3. Which does not belong? A)Apple B)Banana C)Orange D)Carrot ---
Correct D

Q4. All roses are flowers. Some flowers are red. Which is definitely
true? A)All roses are red B)Some roses are red C)Roses are flowers D)No
roses are red --- Correct C

Q5. A clock shows 3:00. What is the angle? A)45° B)60° C)90° D)180° ---
Correct C

Q6. How many letters are in COMPUTER? A)6 B)7 C)8 D)9 --- Correct C

Q7. Which number is different? A)9 B)16 C)25 D)30 --- Correct D

Q8. 1,1,2,3,5,8,? A)10 B)11 C)12 D)13 --- Correct D

Q9. Book is to Reading as Fork is to: A)Cooking B)Eating C)Writing
D)Cutting --- Correct B

Q10. If 5 machines make 5 products in 5 minutes, how long does 1 machine
take to make 1 product? A)1 B)5 C)10 D)25 minutes --- Correct B

**Scoring:**

Each correct answer = 1 point. Raw score = correct answers / total
questions. Percentage = raw score × 100.

Do not convert percentage into a clinical IQ number unless a validated
conversion table is explicitly implemented.

The backend checks each answer against the stored correct answer,
calculates the score, matches it to a score range, and displays the
predefined description written for that range. No AI is used to grade
answers or interpret performance.

8\. TEST 5 --- SPIRIT ANIMAL / MYTHICAL ANIMAL TEST

This is an entertainment/self-reflection personality experience, not a
scientific diagnosis.

**Possible results:**

Wolf, Eagle, Lion, Dolphin, Owl, Fox, Bear, Butterfly, Dragon, Phoenix.

**Questions:**

Q1. When facing a difficult situation: A)Take charge --- Lion B)Analyze
--- Owl C)Creative solution --- Fox D)Trust instincts --- Wolf

Q2. In a group: A)Lead --- Lion B)Observe --- Owl C)Connect everyone ---
Dolphin D)Work independently --- Eagle

Q3. Greatest strength: A)Courage --- Lion B)Wisdom --- Owl C)Loyalty ---
Wolf D)Adaptability --- Fox

Q4. Value most: A)Freedom --- Eagle B)Connection --- Dolphin
C)Transformation --- Phoenix D)Protection --- Bear

Q5. When hurt: A)Confront --- Lion B)Withdraw --- Owl C)Understand ---
Dolphin D)Become independent --- Eagle

Q6. Ideal environment: A)Peaceful --- Owl B)Social --- Dolphin
C)Adventurous --- Eagle D)Safe --- Bear

Q7. Decisions mainly through: A)Logic --- Owl B)Instinct --- Wolf
C)Emotion --- Dolphin D)Courage --- Lion

Q8. Change makes you feel: A)Excited --- Butterfly B)Cautious --- Bear
C)Curious --- Fox D)Powerful --- Phoenix

Q9. People see you as: A)Mysterious --- Owl B)Strong --- Lion C)Loyal
--- Wolf D)Charming --- Fox

Q10. Biggest desire: A)Freedom --- Eagle B)Love --- Dolphin C)Power ---
Dragon D)Peace --- Owl

Expand to 30 questions using the same structured mapping (every answer
option is pre-assigned to exactly one animal).

**Scoring:**

Each selected answer gives 1 point to its assigned animal. Highest score
= primary animal. Second-highest = secondary animal.

The backend tallies the points and determines the result, then displays
the predefined description written for that primary/secondary animal
combination. No AI is used to determine or explain the result.

9\. TEST 6 --- CUBE PERSONALITY TEST

A symbolic self-reflection exercise. The user imagines a scene
containing a cube, ladder, horse, flowers and storm.

To keep scoring fully deterministic and answer-based, every question in
this test must use fixed multiple-choice answer options rather than open
free-text responses. Each answer option is pre-assigned to a specific,
pre-written trait description, in the same way the other tests map
answers to results.

**Cube:**

> 1\. How large is the cube? (e.g., Small / Medium / Large / Enormous)
>
> 2\. What is it made of? (e.g., Glass / Wood / Stone / Metal)
>
> 3\. Is it transparent? (e.g., Fully transparent / Partly transparent /
> Opaque)
>
> 4\. Where is it? (e.g., Open field / Forest / Mountain top / Water\'s
> edge)
>
> 5\. How do you feel looking at it? (e.g., Calm / Curious / Uneasy /
> Confident)

**Ladder:**

> 1\. Where is the ladder? (e.g., Leaning on the cube / Nearby / Far
> away / Not visible)
>
> 2\. How large is it? (e.g., Short / Medium / Tall / Extremely tall)
>
> 3\. What is it made of? (e.g., Wood / Metal / Rope)
>
> 4\. Is it touching the cube? (e.g., Yes, resting on it / Nearby but
> not touching / Far from it)
>
> 5\. How do you feel about it? (e.g., Hopeful / Neutral / Anxious /
> Determined)

**Horse:**

> 1\. Where is the horse? (e.g., Next to the cube / In the distance /
> Not visible)
>
> 2\. What is it doing? (e.g., Standing still / Running / Grazing /
> Watching)
>
> 3\. What does it look like? (e.g., Calm and strong / Wild / Gentle /
> Majestic)
>
> 4\. Is it close to the cube? (e.g., Very close / Somewhat close / Far)
>
> 5\. How do you feel about it? (e.g., Connected / Cautious / Admiring /
> Indifferent)

**Flowers:**

> 1\. How many are there? (e.g., None / A few / Many / A whole field)
>
> 2\. Where are they? (e.g., Around the cube / Scattered / Far away)
>
> 3\. What color are they? (e.g., Bright colors / Pastel colors / White
> / Mixed)
>
> 4\. Are they close to the cube? (e.g., Very close / Somewhat close /
> Far)
>
> 5\. How do you feel about them? (e.g., Joyful / Peaceful /
> Indifferent)

**Storm:**

> 1\. Where is the storm? (e.g., Right over the cube / Nearby / Far on
> the horizon / Not present)
>
> 2\. How strong is it? (e.g., Mild / Moderate / Severe)
>
> 3\. Is it approaching? (e.g., Moving closer / Staying still / Moving
> away)
>
> 4\. Is the cube affected? (e.g., Yes, directly / Slightly / Not at
> all)
>
> 5\. How do you react? (e.g., Take shelter / Watch calmly / Feel
> anxious / Feel unaffected)

**Interpretation framework (used to write the predefined
descriptions):**

-   Cube → Self-image

-   Cube size → Perceived importance/presence of self

-   Cube material → Emotional boundaries

-   Cube transparency → Openness

-   Cube location → Perceived position in life

-   Ladder → Ambition/support

-   Horse → Relationship/partner symbolism

-   Flowers → Social/relationship connections

-   Storm → Stress/change/challenges

The backend stores the selected answer options and, using this
predefined framework, assembles the result from fixed, pre-written
description snippets tied to each answer choice --- there is no dynamic
generation involved. These descriptions must be framed as
symbolic/self-reflection content, not scientifically proven
psychological facts.

10\. TEST 7 --- RELATIONSHIP / COMPATIBILITY TEST

**Categories:**

-   Communication

-   Trust

-   Emotional Connection

-   Conflict Management

-   Independence

-   Affection

-   Commitment

-   Compatibility

**Answer scale:**

-   1 = Strongly Disagree

-   2 = Disagree

-   3 = Neutral

-   4 = Agree

-   5 = Strongly Agree

**Questions:**

**Communication:**

> 1\. I communicate my feelings openly.
>
> 2\. I feel comfortable discussing difficult subjects.
>
> 3\. I listen carefully when my partner speaks.
>
> 4\. I prefer resolving misunderstandings quickly.

**Trust:**

> 1\. I find it easy to trust someone I love.
>
> 2\. I respect my partner\'s privacy.
>
> 3\. I do not constantly need reassurance.
>
> 4\. I believe trust should be built through consistent behavior.

**Emotional Connection:**

> 1\. Emotional intimacy is essential to me.
>
> 2\. I want my partner to understand my deeper feelings.
>
> 3\. I enjoy sharing personal experiences.
>
> 4\. I feel emotionally connected when we spend meaningful time
> together.

**Conflict:**

> 1\. I can disagree without becoming disrespectful.
>
> 2\. I am willing to apologize when I am wrong.
>
> 3\. I try to understand my partner\'s perspective during arguments.
>
> 4\. I avoid using silence as punishment.

**Independence:**

> 1\. Both partners should maintain individual interests.
>
> 2\. I am comfortable spending time apart.
>
> 3\. I respect my partner\'s independence.
>
> 4\. I do not believe couples need to do everything together.

**Affection:**

> 1\. I enjoy expressing affection.
>
> 2\. I appreciate receiving affection.
>
> 3\. Physical affection is important to me.
>
> 4\. Small romantic gestures matter to me.

**Commitment:**

> 1\. Loyalty is essential in a relationship.
>
> 2\. I prefer long-term commitment.
>
> 3\. I believe relationships require effort.
>
> 4\. I remain committed even during difficult periods.

**Compatibility:**

> 1\. Similar values are important to me.
>
> 2\. I believe partners should have compatible life goals.

**Scoring:**

The backend calculates the average of the answers in each category.

**Example:**

-   Communication 4.2/5

-   Trust 3.8/5

-   Emotional Connection 4.7/5

-   Conflict 3.1/5

-   Independence 4.4/5

-   Affection 4.6/5

-   Commitment 4.8/5

-   Compatibility 4.3/5

The backend matches each category average to the predefined description
written for that score band and displays it. The result must not claim
to predict relationship success or failure, and no AI is used to
generate or personalize the text.

11\. DATABASE STRUCTURE

**TESTS:**

test_id, test_name, description, version, price, active, question_count,
scoring_method, interpretation_framework

**QUESTIONS:**

question_id, test_id, category, question_text, question_type, order

**ANSWER OPTIONS:**

answer_id, question_id, answer_text, numerical_value, scoring_category,
scoring_direction, result_mapping

**RESULTS (predefined, admin-written descriptions):**

result_id, test_id, result_name, minimum_score, maximum_score,
description, strengths, challenges, communication, relationships,
recommendations

**USER TEST RESULTS:**

result_id, user_id, test_id, test_version, purchase_id, date_completed,
answers, raw_scores, category_scores, final_result

12\. DETERMINISTIC SCORING PIPELINE

The backend must contain a single, centralized deterministic scoring
engine.

Input: User answers → Scoring rules → Calculation → Raw scores →
Category scores → Final result → Matching predefined result description

If the same answers are submitted twice using the same test version, the
numerical result and the displayed description must be identical every
time. No AI or other non-deterministic component is part of this
pipeline, so this is guaranteed by construction.

13\. SECURITY

Website Frontend → Secure Backend → Database

User answers, scores, and results should be protected appropriately
(encrypted storage/transport, access controls, and standard backend
security practices). There is no external AI API involved, so there is
no AI API key to protect.

14\. RESULT STORAGE

After completion, save:

-   User ID

-   Test ID

-   Test version

-   Date

-   Answers

-   Raw scores

-   Category scores

-   Final result

-   The predefined result description shown to the user

15\. TEST VERSION CONTROL

Every test must have a version, e.g. MBTI Version 1.0.

If questions or scoring rules change, create Version 1.1.

Old results must remain associated with the exact version used when the
user completed the test.

16\. ADMIN PANEL

Administrator capabilities:

-   Create/edit tests

-   Add/edit questions

-   Add answer choices

-   Modify scoring rules

-   Create categories

-   Create result types

-   Write and edit the predefined result description text for each
    possible result

-   Activate/deactivate tests

-   Change price

-   Create test versions

-   View completed tests

-   View purchases

-   View user results

17\. FUTURE TEST CREATION

To add a future test, define:

Test Name → Description → Categories → Questions → Answer Options →
Scoring Rules → Score Thresholds → Possible Results → Predefined Result
Description Text

The same testing engine should process the new test.

18\. FINAL ARCHITECTURE

**THE BACKEND CALCULATES THE SCORE AND DISPLAYS THE MATCHING PREDEFINED
RESULT.**

Questions → User Answers → Backend Scoring Engine → Numerical Scores →
Category Scores → Final Result → Predefined Result Description → User
Result Page

This gives My Inner consistent, fully reproducible, answer-based scoring
and results, with no AI involved anywhere in the calculation or
presentation of a result.

19\. QUALITY & VALIDATION RECOMMENDATION

Before launch, review and test every question and scoring key for
contradictions, accidental bias, unclear wording and balanced coverage
of each dimension. Serious psychological claims should only be made when
supported by appropriate validated assessment methodology. Symbolic and
entertainment tests should be clearly labeled as self-reflection
experiences.
