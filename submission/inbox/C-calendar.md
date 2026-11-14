<!-- AI-assisted: written with help from Claude (Anthropic). Reviewed by Charulekha Rajesh (pending). -->
# Draft for the project page: the burning calendar

The burning calendar shows every month from November 2000 to today as one
row per year, coloured on a ramp that people with colour-vision deficiency
can read. Hover or tap a month to see its exact value. Switch to Raw to see
the jump in 2012, when VIIRS joined MODIS; on the harmonized record the jump
is gone. Months before July 2002 come from Terra alone and are hatched,
because they are not harmonized.

## Draft: the answer on top and the comparisons

The first line of the app answers "is now unusual here?": for example
"November 2026 so far (1 to 5 Nov): lowest of 25 Novembers, 0.06 times the
median" for Punjab and Haryana. It ranks first and gives the ratio second,
because a ratio means nothing when the usual value is zero. The current month
is never complete, so every earlier year is counted over the same days. Below
a minimum of activity the app says "too little activity to judge" instead of a
label. The calendar outlines the months that usually hold most of the burning,
and every chart downloads as CSV, PNG and SVG with its sources written in.
