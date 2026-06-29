# reznull

Predict the outcome of an A/B test before you run it, by simulating your real users as AI agents.

## Summary

You build a population of synthetic users from your historical behavioral data, point an experiment at them, and get a ranked prediction of how each variant performs in hours rather than the week or two a live test takes. The same population lets you screen dozens of variants and ideas that would never be worth the cost of a real experiment, and shortlist the few that are.

## Problem

Agentic coding has collapsed the time from idea to shipped variant. The validation step has not moved. Most product changes still need a live A/B test before they reach all users, and a live test has a floor on its duration that has nothing to do with how fast you can build. You need roughly a week or two to capture weekday and weekend seasonality and to accumulate enough samples per arm to reach significance. Three costs follow from that floor.

Every day of the test, a share of your traffic sees the worse variant. For a media headline or a checkout change, the opportunity cost of running the loser for even an hour is real money.

Traffic is finite and gets divided across arms, so testing many variants at once pushes each arm below the rate it needs to reach significance. In practice teams test two or three variants because that is what the traffic budget and the experimentation platform allow.

Every variant has to be built, reviewed, instrumented, and deployed before it can be tested. Ideas that lose consumed all of that effort, and most tests lose or come back inconclusive.

## What it does

reznull works on the four costs above.

It screens many variants cheaply. You can put twenty headlines or ten onboarding flows in front of the synthetic population and rank them, where a live test would force you to pick two or three up front.

It shortlists. The ranking narrows a large candidate set down to the two or three worth a real experiment, so live traffic is spent only on contenders.

It tests ideas with no implementation. A synthetic user reacts to a description of a variant rather than a deployed build, so you can evaluate a change before anyone writes the code for it.

It shortens the live test that remains. For changes you still want to confirm on real traffic, a calibrated population lets you run a short holdout to verify direction and refresh the personas, instead of waiting for a from-scratch test to reach full significance.

## Who it's for

Any team whose roadmap is gated on experiments. E-commerce on PDPs, checkout, urgency, and returns copy. SaaS and PLG on onboarding, activation, pricing, upgrade prompts, and lifecycle email. Media on headlines, thumbnails, paywall copy, and recommendation modules. Marketplaces, travel, food delivery, and streaming all run the same loop on different surfaces.

## How it works

A persona is one real user encoded as an agent. Its system prompt and state carry that user's history: what they have browsed and bought, how often, what they have asked support, which past variants they responded to, and the segment they belong to. Personas are not static. As new behavioral data arrives, a persona's preferences and state update, so the population tracks the real user base over time.

Calibration is what makes the predictions trustworthy. Before a population is used for decisions, you backtest it against past A/B tests where the real outcome is known. You replay the historical scenario, compare the population's predicted preference against what real users actually did, and tune until the agreement holds up on tests the population was not tuned on. A population that cannot reproduce past results does not get used to call new ones.

For ongoing tests you keep a holdout. You still expose a fraction of real traffic for a day or two, both to confirm the predicted direction and to feed fresh behavior back into the personas. The hypothesis behind the time saving is that confirming the direction of a calibrated prediction needs far less data than detecting a small effect from nothing, so the live window shrinks from a week to a couple of days. This has to be made rigorous per metric and effect size, and until it is, the holdout is also the safety net.

## What it does not do

It does not remove live testing entirely. It removes most of it and shortens the rest. The holdout stays until calibration earns the right to drop it for a given surface.

It does not predict behavior it has never seen. A genuinely novel mechanic with no analog in the user's history has no signal to draw on, and the population's output there is a hypothesis, not a result.

It is not a general consumer simulator. A population is built and calibrated for one product and its users, and predictions do not transfer across products without recalibration.

It does not promise absolute numbers out of the box. Calibration buys correct ranking and direction first. Absolute conversion rates are a harder claim and depend on how well the population is tuned.

## Core principles

Calibrate before you trust. A population earns the right to make a call by reproducing known outcomes first.

Keep a holdout until the data says you can drop it. Cutting the live window is a result you demonstrate per surface, not a default you assume.

Optimize for correct ranking over precise magnitudes. Most decisions only need to know which variant wins and by roughly how much.

Personas evolve with real data. The population is only as good as how closely it tracks the live user base.

## Use cases

E-commerce. Screen fifty variants of a PDP, product image, or checkout flow against the population, ship the predicted winner, and spend the roughly 42-day median live test only on the one or two that matter. Most live tests here come back inconclusive, so cutting the count of tests that ever reach traffic is most of the value.

SaaS and PLG. Replay activation journeys for different user types before real exposure. Rank onboarding flows by predicted activation, and test pricing-page and upgrade-prompt changes that are otherwise slow and politically expensive to put in front of real revenue.

Media. Pre-rank headlines and thumbnails before spending the freshness window. At media scale a few percent more clicks is significant, and the cost of serving a worse headline while a live test resolves is the cost reznull removes.
