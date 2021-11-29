import pandas as pd

df = pd.DataFrame(pd.read_csv("chartsRaw.csv"))
pre = df.size

new = df.groupby(["artist", "song"]).agg(
	{'peak-rank': 'min',
	'weeks-on-board': 'max',
	'date': 'max'
	})

rename = new.rename(columns={"weeks-on-board": "weeksOnBoard", "peak-rank": "peakRank"})

rename.to_csv("charts.csv")


print(pre > rename.size)
print(pre, rename.size)
print(rename.columns)