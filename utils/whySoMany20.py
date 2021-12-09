import numpy as np
import pandas as pd 

#investigating commonality of 20 weeks on the charts
#seems legit

df = pd.DataFrame(pd.read_csv("chartsRaw.csv", parse_dates=["date"]))

df = df[df['date'].dt.year > 1979]
df = df[df['peak-rank'] <= 40]

checkRawTwenties = len(df[df['weeks-on-board'] == 20])
print(df['weeks-on-board'].value_counts())
print(checkRawTwenties / len(df) * 100, "% of ungrouped song data lasted 20 weeks on board")

df = df.groupby(["artist", "song"]).agg(
	{'peak-rank': 'min',
	'weeks-on-board': 'max',
	'date': 'max'
	})

checkGroupedTwenties = len(df[df['weeks-on-board'] == 20])
print(checkRawTwenties / len(df) * 100, "% of grouped song data lasted 20 weeks on board")
print(df['weeks-on-board'].value_counts())

print(checkRawTwenties, checkGroupedTwenties)