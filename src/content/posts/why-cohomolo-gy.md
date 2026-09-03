---
title: Why cohomolo.gy
description: I bought this domain for the pun and then had to live with it. Cohomology measures how local data fails to glue into global data, which turns out to be a fair description of what a personal site is.
date: 2026-09-03
tags: [meta, mathematics]
draft: true
math: true
toc: false
---

I registered this domain for the joke. Guyana runs the `.gy` registry and appears not to care what I do with it, so `cohomolo.gy` cost about the price of a good dinner and left me with a name I have now had to live with for years. Live with a joke long enough and it turns into a thesis.

Here is the thesis.

Cohomology is the machinery for measuring how local data fails to glue into global data. Start with a space. On every small patch you can write down something true: a function, a differential form, a measurement, a section of some bundle. The patches overlap. On the overlaps your local truths have to agree, and usually they do, and when they agree everywhere you staple them into one global object and go home.

Cohomology is what you compute when you cannot go home.

The formal version is a cochain complex, a sequence of groups with maps between them:

$$
\cdots \longrightarrow C^{n-1} \xrightarrow{\;d\;} C^{n} \xrightarrow{\;d\;} C^{n+1} \longrightarrow \cdots
$$

The map $d$ is the coboundary. It takes a thing defined on $n$-dimensional pieces and reports the discrepancy it produces on $(n+1)$-dimensional pieces. The whole subject rests on one identity:

$$
d \circ d = 0
$$

In its homological dress this is $\partial^2 = 0$, the boundary of a boundary is empty, which you can check on a triangle in about fifteen seconds and which then quietly runs everything. It says that anything already a boundary is automatically closed. So the closed things ($\ker d$) contain the exact things ($\operatorname{im} d$) for free, and the free ones tell you nothing. Quotient them out and you get what is left:

$$
H^n = \ker d_n / \operatorname{im} d_{n-1}
$$

Closed but not exact. Locally consistent, globally not derivable from anything. That quotient is the measurement, and it is the only part of the setup that carries information.

I find this an unreasonably good description of how understanding actually accumulates.

Every note I write is local data. It is true on its patch: this compiles, this proof goes through, this optimiser does the thing on this problem. Notes are cheap and I have thousands of them, in margins and commit messages and files named `scratch2.md`. What is expensive is the gluing. Most of them do not glue. Two notes on adjacent patches disagree on the overlap and you discover, three years later, that you believed two incompatible things about the same object and never noticed because you never put them side by side.

A site is a place to force the overlap. Publishing a thing is the cheapest available way to find out whether it is closed but not exact, or just wrong.

I am not going to pretend the analogy is a theorem. It is a joke that survived contact with reality better than I expected, which is the most anyone can ask of a domain hack.

## What goes here

Four things, roughly, and they are less separate than that makes them sound.

**Type theory and functional programming.** Where I have spent most of my working life. Optics, algebraic structure in libraries, the parts of category theory that pay rent, the parts that do not and are worth it anyway.

**Learning machines and optimisation.** What I am reading now, and reading with the specific discomfort of someone who came up in a field where you prove the thing before you ship it. There is a great deal of real mathematics under reinforcement learning and a great deal of folklore on top of it, and I want to know which is which.

**Mathematics.** Topology and geometry are how I was taught to see, and I do not seem to be able to stop.

**The strange future.** These fields are converging and nobody involved fully knows on what. I would like to write down what I think while it is still possible to be wrong in public about it.

## On schedules

I am not promising one. Sites that open with a posting cadence tend to close with an apology for the posting cadence, and I would rather skip both.

What I will promise is that things here are dated, revisable, and marked when they are guesses. A note that turns out to be wrong gets a correction rather than a quiet deletion, because the correction is usually the interesting part. The failure to glue is the content. That is the entire joke, and I think it is a good one.

<!-- TODO(emily): the section on what you're reading now is the thinnest part. Worth a concrete example — a specific paper or result that surprised you — if you want it to land. -->
