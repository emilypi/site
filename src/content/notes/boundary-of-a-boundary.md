---
title: The boundary of a boundary is empty
description: Why ∂² = 0, checked on a single triangle. Six points, three cancelling pairs, nothing left over.
date: 2026-09-03
tags: [mathematics]
draft: true
math: true
---

The identity that runs all of homology is

$$
\partial \circ \partial = 0
$$

You can check it on a triangle in about fifteen seconds, and I think everyone should, once.

Take a triangle with vertices $v_0, v_1, v_2$. Its boundary is the three edges, taken with orientation, which is what the alternating signs record:

$$
\partial [v_0, v_1, v_2] = [v_1, v_2] - [v_0, v_2] + [v_0, v_1]
$$

Now take the boundary again. The boundary of an edge is its endpoints, head minus tail:

$$
\partial [v_i, v_j] = [v_j] - [v_i]
$$

Apply that to all three edges and expand:

$$
\big([v_2] - [v_1]\big) - \big([v_2] - [v_0]\big) + \big([v_1] - [v_0]\big)
$$

Six points. Each vertex shows up exactly twice, once with each sign, because each vertex is the head of one edge in the loop and the tail of the next. Everything cancels. Nothing is left.

That is the whole content: walk around a closed loop and you come back to where you started, so the net displacement is zero. Orientation is what turns "you come back" into arithmetic.

Everything downstream is bookkeeping on this. Because $\partial^2 = 0$, every boundary is a cycle, so $\operatorname{im} \partial_{n+1} \subseteq \ker \partial_n$ and the quotient is defined. Homology is the measurement of the cycles that are *not* boundaries — loops that close up but do not bound anything, which is to say holes.

<!-- TODO(emily): the last line elides that homology detects holes only up to the equivalence — worth one more sentence, or worth leaving as the note it is? -->
