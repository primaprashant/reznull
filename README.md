# reznull

reznull predicts the outcome of an A/B test before you run it, by simulating your real users as AI agents. You build a population of synthetic users from historical behavioral data, point an experiment at them, and get a ranked prediction of how each variant performs in hours instead of the week or two a live test takes.

The name **rez null** is short form of "reject the null hypothesis", which is the outcome you actually want out of an A/B test. We help you quickly find the variant worth rejecting the null hypothesis for.

## Why

Agentic coding made shipping variants fast, but live A/B tests still need a week or two to reach significance. That window is wasted traffic, split across arms, on variants that mostly lose. reznull screens many variants cheaply, shortlists the few worth a real test, and shortens the live test that remains.

## About this repo

This is a one-hour build for an OpenAI hackathon. It is a hardcoded Flask demo meant to make the product legible to judges, not a production system. See `VISION.md` for the product brief, `MVP.md` for what the demo does, and `PLAN.md` for the build order.
