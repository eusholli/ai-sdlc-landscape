---
title: "The maths of software ownership, in plain words"
description: "Starting more work raises clean output only up to a point, and a low first-time pass rate tips the system into rework sooner."
date: 2026-10-30
kind: signed
author: Geoff Hollingworth
cover: cover.svg
cover_alt: "A blueprint schematic. Top: one change passes six gates, design, implement, review, test, merge and release, each passing 0.9 of work, so only 0.53 arrives clean and the rest returns as rework. Bottom: five changes branch from main at different snapshots, run in parallel, one clashes, and all converge on a single merge."
---

**It is possible to mathematically measure maximum throughput of software production. The proposal is in the Software Ownership Paper [here](https://aisdlclandscape.org/ownership#appendix-g-a-candidate-formalisation-of-the-convergence-model) and I am going to try and give an easy introduction to the logic.**

## Summary

The effective output of software production in any company is the combination of how many changes can be made that are correct combined with how many changes can be made in parallel and be correct first time. There is something intuitively correct in that statement but the actual finding of the values are not universally consistent, it depends on the software being produced, its modularity, structure, and consistency, and if this degrades over time, effective throughput declines.

Is this calculation correct, complete, of value? I want to write this introduction to try and get feedback. It is something however that research could measure and use to benchmark both Software Development Lifecycle (SDLC) AI instrumentation quality, and per tool effectiveness.

We start with some fundamental truths that might be surprising when seen.

## 1. Small losses multiply

Any single software change goes through multiple stages, from research, to design, to implementation, to review, to testing, to merging, to testing again, to release and so on.  If there are 6 phases (leaving research out) and each phase has a 90% correctness rate, which might feel high, only ~50% of jobs pass through all six. Every stage appears high quality but the end to end whole does not.

```text
0.9 × 0.9 × 0.9 × 0.9 × 0.9 × 0.9 ≈ 0.53
```

The paper calls the end to end value **single-change yield**: the share of changes that pass from intent to durable production without rework.

## 2. A busy step makes everyone wait

Any step that becomes overloaded causes delay in everything and queueing theory explains being at a 90% load causes delays 6 times longer than when at 60% load, the delay is not linear.  Some stages, some jobs require human oversight, human oversight capacity is not elastic. At 60% busy a change typically finds one or two reviews ahead of it; at 90% busy it finds about nine, so it waits about six times as long.

And a failed change requires to start again and rejoins the same queue as new work. So rework slows every change in the queue, there is a threshold where rework and new work cause ever increasing rework due to increased time in development.

## 3. Count what is in flight

If L is the number of changes in flight, and λ (lambda) is how fast new ones are started and X is how fast they are accepted, and γ (gamma) is how fast they are cancelled then overall, the change in the number of changes in flight per unit of time = λ − X − γ.

```text
change in L per unit of time  =  λ − X − γ
```

If you start work faster than you finish or cancel it, then changes in flight, L, grows. With W as the average time a change spends in flight and X is how fast each is processed:

```text
L ≈ X × W
```

When X is constant, a bigger pile can only mean a longer wait.  Let's use a simple analogy of a school dinner line. The dinner lady can serve 2 children every minute and each child stands in the line about 5 minutes then there are about 10 kids in line (the dinner lady serving is the bottleneck).  Every minute 2 children get served and leave the line, if you are waiting in line 5 minutes that means 10 children have been served by the time you get served (moved from the back of the line to the front).  If suddenly 30 children turn up then the wait time (W) becomes 15 minutes.

## 4. The odds a change lands clean

When a change starts, it implements against a snapshot of the system taken at that time.  Each change in flight is doing the same, and the snapshots taken depend on when the job started. The longer you take and the more changes in flight that are changing their snapshots, then the bigger likelihood there are clashing changes.  

The paper captures this in terms of probability of changes, changes happening that clash for whatever reason, and the chance the change being worked on is wrong.

While your change is in flight, about L others are accepted. Each one alters something your change rests on with probability p, the overlap. Other drift, such as a new requirement or a changed dependency, arrives at rate δ (delta). And ε (epsilon) is the chance the change is wrong as built. The chance it lands without rework is roughly:

```text
P(clean) ≈ (1 − ε) × e^−(p×L + δ×W)
```

The best way to interpret this is as all conditions must hold, the implementation was correct, no clashes happen while in flight. The longer a change is in flight and the more changes in flight in parallel, then the more likely something has changed.

## 5. Why more work in flight peaks

Clean output, X₀, is the acceptance rate times the chance of landing clean:

```text
X₀ ≈ (L ÷ W) × (1 − ε) × e^−(p×L + δ×W)
```

More work in flight raises the first factor and shrinks the last. Hold W fixed, and the two balance at one point:

```text
L* = 1 ÷ p
```

To put it simply if there is a 1 in 20 chance that an accepted change touches the part of the snapshot you are changing then peak change parallelism is 20.

## 6. The two problems feed each other

The more errors for every single change in flight leading to rework, then the more changes in flight leading to more potential rework, or slower throughput.  The more parallel changes in flight, the more potential for clashes leading to errors in each change, leading to more rework and so on.

## 7. Measure the four inputs on your own codebase

There is not universal standard best performance, there is only best performance relative to each codebase, due to overlap of changes being dependent on encapsulation and modularity of the architecture and code. However, the more AI coding degrades the principles of good design in a code base, the more the theoretical maximum throughput will reduce, lowering overall possible outcome and value.

## In conclusion

I hope this made sense and felt intuitively right.  If assumptions feel wrong or incomplete then please contact.
