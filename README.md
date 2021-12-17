## Intro
My whole life I've loved music. I've always wondered - what makes music hot? This visualization depicts a scatter plot of every Top 40 Billboard Hot 100 song of all time. The plot allows for filtering points by different audio attributes like danceability and loudness, as well as genre and peak chart rank. Check out the plot to see how these different attributes correlate to chart performance!

## Link to Visualization
https://dgmolla.github.io/hot100/

## Sources
Billboard Hot 100 Dataset: https://www.kaggle.com/dhruvildave/billboard-the-hot-100-songs
Audio attribtues and genres collected from Spotify API

## Tech Used
Pandas
Python
D3
JavaScript

## I want to use this to visualiza my own raw song data - how??
First, replace "utils/chartsRaw.csv" with your own raw song data csv. You need to match up your csv's column names with those being pulled in "./charts.js". You can do so by editing "./charts.js" corresponding variables as well as how the dataframe is grouped in "preprocessing.py".

To get audio attributes, add a "config.py" containing your own clientID and client secret from your Spotify developer console. Now just run "preprocessing.py" to build your final csv! Note: this will likely take a while because of the amount of queries (depending on your raw data size)

Now just fire up a local server and open index.html for your new visualization!



