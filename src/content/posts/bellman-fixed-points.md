---
title: Bellman's operator is a contraction, and that is the whole game
description: Value iteration is not an algorithm you have to remember. It is Banach's fixed-point theorem applied to an operator that happens to be a contraction, and everything else — the convergence rate, the stopping rule, the place it all falls apart — follows from the discount factor.
date: 2026-09-03
tags: [reinforcement-learning, mathematics, haskell]
draft: true
math: true
toc: true
lede: Reinforcement learning is full of algorithms that look like they were discovered by accident. Most of them are one theorem, and the theorem is about a metric space.
---

The first time I read the value iteration pseudocode I had the specific irritation of someone being handed a magic trick. Initialise a table of numbers arbitrarily. Sweep over it, replacing each entry with a max over actions of something involving the other entries. Repeat until the entries stop moving. Congratulations, those are the optimal values.

Why would that work? Why would sweeping a table repeatedly converge to anything, let alone to the right thing, from *any* starting table?

It works because the sweep is a contraction, and contractions on complete metric spaces have exactly one fixed point that you reach from anywhere. That is Banach's theorem, it dates to 1922, and once you see it sitting under the pseudocode the algorithm stops being a trick and becomes the only thing that could have happened.

## The setup

A Markov decision process is a tuple $(S, A, P, R, \gamma)$. States $S$, actions $A$, a transition kernel $P(s' \mid s, a)$, a reward $R(s,a)$, and a discount factor $\gamma$ with

$$
0 \le \gamma < 1
$$

Take $S$ and $A$ finite and $R$ bounded. That strict inequality on $\gamma$ is not a modelling convenience or a hack to keep sums finite. It is the hypothesis. Every good thing below is a statement about $\gamma$, and at $\gamma = 1$ they all stop being true at once.

A value function $v$ assigns a real number to each state, so $v \in \mathbb{R}^S$. The Bellman optimality operator $T$ maps value functions to value functions:

$$
(T v)(s) = \max_{a \in A} \Big[\, R(s,a) + \gamma \sum_{s'} P(s' \mid s, a)\, v(s') \,\Big]
$$

Read it as: the value of $s$ under $v$, looking one step ahead. Take the best action, collect its reward, then trust $v$ for whatever happens next, discounted. That is all a Bellman backup is — one step of honest lookahead stapled to one step of borrowed optimism.

The optimal value function $v^*$ is the one that satisfies $T v^* = v^*$. Looking one step ahead does not improve it, because it has already looked ahead forever. It is a fixed point.

## $T$ is a $\gamma$-contraction

Measure distance between value functions in the sup norm, $\|v\|_\infty = \max_s |v(s)|$. The claim:

$$
\|T v - T w\|_\infty \le \gamma \, \|v - w\|_\infty
$$

Apply $T$ to two value functions and they get strictly closer together, by a factor of at least $\gamma$. Every time. Regardless of what they were.

The proof needs one small lemma about maxima, which is worth stating separately because it does all the work:

$$
\Big| \max_a f(a) - \max_a g(a) \Big| \le \max_a \big| f(a) - g(a) \big|
$$

To see it, let $a^\star$ maximise $f$. Then $\max_a f(a) - \max_a g(a) \le f(a^\star) - g(a^\star) \le \max_a |f - g|$, using $\max_a g(a) \ge g(a^\star)$. Swap $f$ and $g$ for the other direction. Taking a max is a nonexpansive operation: it cannot push things apart. (Finite $A$ is doing quiet work here, so the maxima are attained.)

Now fix a state $s$. The rewards are identical in both expressions and cancel:

$$
\begin{aligned}
\big| (T v)(s) - (T w)(s) \big|
&\le \max_a \Big| \gamma \sum_{s'} P(s' \mid s,a)\,\big(v(s') - w(s')\big) \Big| \\
&\le \gamma \max_a \sum_{s'} P(s' \mid s,a)\, \big| v(s') - w(s') \big| \\
&\le \gamma \max_a \sum_{s'} P(s' \mid s,a)\, \|v - w\|_\infty \\
&= \gamma \, \|v - w\|_\infty
\end{aligned}
$$

The last step is the only place the transition kernel matters, and it matters only because $\sum_{s'} P(s' \mid s,a) = 1$. A convex combination of numbers each bounded by $\|v - w\|_\infty$ is bounded by $\|v - w\|_\infty$. The dynamics are irrelevant. Any stochastic matrix would do.

Take the max over $s$ on the left and you have the contraction.

I want to underline how little went into that. No structure on the reward beyond boundedness, no assumption about the chain — no ergodicity, no irreducibility, no aperiodicity. The whole thing is: probabilities sum to one, max is nonexpansive, and there is a $\gamma$ out front.

## Banach does the rest

**Banach fixed-point theorem.** Let $(X, d)$ be a non-empty complete metric space and $T : X \to X$ a contraction with modulus $\gamma < 1$. Then $T$ has exactly one fixed point $x^*$, and for any $x_0$, the sequence $x_{k+1} = T x_k$ converges to it.

$\mathbb{R}^S$ with the sup norm is complete when $S$ is finite, so the theorem applies directly. It gives three things, and it is worth separating them because people tend to quote the first and rely on the third.

*Existence.* $v^*$ exists. Not obvious a priori — the Bellman equations are a nonlinear system in $|S|$ unknowns, and nonlinear systems are not in the habit of having solutions.

*Uniqueness.* There is exactly one. No local optima, no basins, no initialisation strategy. The problem has one answer.

*A rate.* Iterating from any $v_0$,

$$
\|v_k - v^*\|_\infty \le \gamma^k \, \|v_0 - v^*\|_\infty
$$

which falls straight out of applying the contraction $k$ times to the pair $(v_0, v^*)$ and using $T v^* = v^*$.

Geometric convergence, with a constant you know before you start. To cut the error by a factor of ten takes about $1 / \log_{10}(1/\gamma)$ iterations, whatever the problem is. At $\gamma = 0.9$ that is roughly 22 sweeps per digit; at $\gamma = 0.99$, about 229. That is the actual cost of caring about the distant future, and it is why long-horizon problems are expensive in a way that has nothing to do with the size of the state space.

## Value iteration is `iterate`

Once you believe the above, the algorithm writes itself. Value iteration is `iterate (bellman m) v0` and a stopping rule. Here is the toy, in Haskell:

```haskell
{-# LANGUAGE StrictData #-}

module Bellman (MDP (..), bellman, valueIteration) where

import Data.Map.Strict (Map)
import qualified Data.Map.Strict as M

type S = Int
type A = Int

data MDP = MDP
  { states  :: [S]
  , actions :: S -> [A]            -- ^ non-empty for every reachable state
  , reward  :: S -> A -> Double
  , next    :: S -> A -> [(S, Double)]  -- ^ sparse P(s'|s,a); weights sum to 1
  , gamma   :: Double              -- ^ 0 <= gamma < 1
  }

type V = Map S Double

-- | One Bellman backup. This is @T@.
bellman :: MDP -> V -> V
bellman m v = M.fromList [(s, backup s) | s <- states m]
  where
    backup s = maximum [q s a | a <- actions m s]
    q s a = reward m s a + gamma m * expected s a
    expected s a = sum [p * M.findWithDefault 0 s' v | (s', p) <- next m s a]

supDist :: V -> V -> Double
supDist a b = maximum (0 : M.elems (M.intersectionWith (\x y -> abs (x - y)) a b))

valueIteration :: Double -> MDP -> V -> V
valueIteration eps m v0 = go (bellman m v0)
  where
    go v =
      let v' = bellman m v
       in if supDist v v' < eps then v' else go v'
```

The seeding is deliberate: `go` only ever compares two maps that came out of `bellman`, so both are keyed by exactly `states m` and the intersection in `supDist` is the whole thing. An arbitrary `v0` is allowed to be partial, and `findWithDefault` reads the gaps as zero.

This is a toy and I would like to be precise about which parts are toy.

$S$ is finite and small enough to sit in a `Map`, which is the entire reason `supDist` is computable. `maximum` is partial, so a state with no available actions is a crash rather than a type error; making that total means an argument that `actions` never returns `[]`, and I have written a comment instead of an argument. `Double` is not $\mathbb{R}$, and the geometric convergence above will happily grind past the point where the floating-point difference is noise.

The stopping rule deserves more suspicion than it usually gets. `supDist v v' < eps` tests whether the *iterates* have stopped moving, which is not the question. The question is whether we are near $v^*$. The contraction relates them: if $\|v_{k+1} - v_k\|_\infty \le \varepsilon$ then

$$
\|v_{k+1} - v^*\|_\infty \le \frac{\gamma \,\varepsilon}{1 - \gamma}
$$

Chase it through: $\|v_{k+1} - v^*\| = \|T v_k - T v^*\| \le \gamma \|v_k - v^*\| \le \gamma(\varepsilon + \|v_{k+1} - v^*\|)$, then solve.

So the thing you measure and the thing you want differ by a factor of $\gamma/(1-\gamma)$. At $\gamma = 0.99$ that is 99. Your residual of $10^{-3}$ buys you an error bound of about $0.1$. I have watched people — I have been people — declare convergence on the residual and then be baffled by the resulting policy.

## Why a functional programmer already knew this

Fixed points are not exotic here. They are the substrate.

```haskell
fix :: (a -> a) -> a
fix f = let x = f x in x
```

We define recursive functions as fixed points of functionals, recursive types as fixed points of functors, and we have a whole vocabulary for it: `Mu`, `Nu`, initial algebras, terminal coalgebras. `valueIteration` above is `fix` with a convergence test, which is what `fix` degenerates to when your carrier is a metric space instead of a domain.

So it is worth asking what the contraction buys over the fixed-point theorems we already use.

The domain-theoretic one is Kleene's: a continuous map on a pointed cpo has a least fixed point, reached as the limit of $\bot, f(\bot), f^2(\bot), \ldots$. The order-theoretic one is Knaster–Tarski: a monotone map on a complete lattice has a least fixed point, and in fact a complete lattice of them.

Both actually apply here. $T$ *is* monotone: if $v \le w$ pointwise then $T v \le T w$, since both the max and the convex combination preserve the order. So even with $\gamma = 1$ you can get a least fixed point out of the lattice structure, and much of the theory of undiscounted and average-reward problems lives exactly there.

What the order does not give you is a *rate*. Knaster–Tarski says a fixed point is there. It says nothing about how long the ascending chain is, or whether you will recognise the top when you arrive, or whether the fixed point you land on is the one you meant — there may be many. Banach replaces "there exists a least one" with "there is exactly one, here is how fast you get to it, and it does not matter where you start."

That is a real trade. You give up generality — you need a metric and a genuine contraction, so you need $\gamma < 1$ — and you get uniqueness and a clock. In a subject where the loop is going to run on a machine for an hour, the clock is the part you needed.

## The same theorem, twice more

Policy evaluation is the same argument with the max deleted. Fix a policy $\pi$ and define

$$
(T^\pi v)(s) = R(s, \pi(s)) + \gamma \sum_{s'} P(s' \mid s, \pi(s))\, v(s')
$$

This is affine in $v$ rather than piecewise-affine, which makes it easier, not different: the proof above goes through with the max lemma unused, and $T^\pi$ is a $\gamma$-contraction with unique fixed point $v^\pi$. Policy iteration is then an alternation between solving one fixed-point problem exactly and improving greedily against the result, and it terminates because there are finitely many policies and each step is a strict improvement until it is not.

Q-learning is the same theorem wearing a disguise. Define the operator on state-action pairs,

$$
(T Q)(s,a) = R(s,a) + \gamma \sum_{s'} P(s' \mid s,a) \max_{a'} Q(s', a')
$$

and the identical argument gives a $\gamma$-contraction in the sup norm on $\mathbb{R}^{S \times A}$. The Q-learning update is not that operator; it is a sample of it. You cannot compute the expectation, so you take one transition and nudge $Q(s,a)$ toward the sampled target with a step size $\alpha$. What makes this converge is stochastic approximation — Robbins–Monro conditions on the step sizes, so that noise averages out while progress does not — *sitting on top of* the contraction. The contraction is what guarantees there is somewhere to converge to. The step-size schedule is what lets the noisy iterate find it. Remove either and it falls over.

## Where it stops helping

The contraction is a statement in the sup norm about tables. Once $S$ is too large for a table and $v$ becomes $v_\theta$ for some parameters $\theta$, the argument breaks, and it is worth being exact about where.

With function approximation, one step is no longer $T$. It is $\Pi T$: apply the Bellman operator, then project the result back onto the representable functions, because $T v_\theta$ generally is not representable. $T$ is a contraction in $\|\cdot\|_\infty$. The projection $\Pi$ is a nonexpansion in whatever norm it is defined by — typically a weighted $L^2$ norm, because that is what least squares minimises. Two operators, each well-behaved in a different norm, and their composite need not be a contraction in either.

There is one clean case. For on-policy evaluation with linear features, if you weight the $L^2$ norm by the stationary distribution of the policy you are following, $\Pi$ is a nonexpansion in *that* norm and $T^\pi$ is a contraction in it, so $\Pi T^\pi$ contracts and the whole thing converges. That is the Tsitsiklis–Van Roy result, and it is why on-policy TD with linear approximation is stable and everything adjacent to it is a research area.

Break any of those conditions — change the distribution you sample from, or the max in $T$, and the guarantee is gone. Sutton and Barto call the combination the deadly triad: function approximation, bootstrapping, and off-policy training. Any two are fine. All three, and there are standard counterexamples where the parameters diverge to infinity on problems with a handful of states.

Deep RL runs all three at once, on purpose, all the time. Target networks, replay buffers, double Q-learning, clipped objectives — a good fraction of the engineering that makes it work is scaffolding erected where the contraction used to be. That is not a criticism. It is worth knowing that is what you are doing, so that when the run diverges you look in the right place.

## Coda

I keep coming back to how much of this is one inequality about a max and a row of a stochastic matrix summing to one.

There is a particular pleasure in a theorem that is simultaneously trivial and load-bearing. Banach's proof fits in a paragraph and you could hand it to a strong undergraduate. It is also the reason a machine can start from a table of arbitrary numbers, with no idea what any of them mean, and arrive at the unique correct answer — and the reason you can say in advance how long that will take.

And $\gamma$ is right there in the middle of it, doing two jobs at once. It is a modelling choice about how much you care about the future, and it is the contraction modulus, the rate, the size of the gap between the residual you measure and the error you have. Those are the same number. Wanting to see further and being able to compute the answer are, in the most literal sense available, in tension. I do not think I had appreciated that a discount factor could be a statement about the geometry of the situation until I saw it as the modulus of a contraction.

<!-- TODO(emily): possible figure for the Banach section: nested balls of radius γᵏ‖v₀ − v*‖ shrinking onto v*. -->
<!-- TODO(emily): "Sutton & Barto" is named but not cited, per plan. Add a real citation if you'd rather. -->
