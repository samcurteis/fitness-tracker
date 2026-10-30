# Fitness Tracker

A personal web app that reads an athlete's training data from intervals.icu and presents it, starting with fitness/fatigue/form trends.

## Language

### Training load

**Fitness**:
Long-term training load: an exponentially weighted average of daily load (intervals.icu default ~42-day time constant).
_Avoid_: CTL, chronic training load

**Fatigue**:
Short-term training load: an exponentially weighted average of daily load (intervals.icu default ~7-day time constant).
_Avoid_: ATL, acute training load

**Form**:
Fitness minus Fatigue; indicates freshness for training or racing.
_Avoid_: TSB, training stress balance, freshness

### Sources

**Athlete**:
The intervals.icu account whose API key is entered in the current browser; the app shows only that Athlete's data.
There is no separate visitor or user: whoever is viewing is the Athlete.
_Avoid_: user, account
