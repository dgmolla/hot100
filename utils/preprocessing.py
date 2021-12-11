import collections
import pandas as pd
import numpy as np
import csv
import json
import requests
import urllib.parse
from utils import helpers

#let's get started cleaning up the raw billboard hot 100 all time data
df = pd.DataFrame(pd.read_csv("chartsRaw.csv", parse_dates=["date"]))

#remove duplicate song entries
df = df.groupby(["artist", "song"]).agg(
	{'peak-rank': 'min',
	'weeks-on-board': 'max',
	'date': 'max'
	})

#we only want top 40 songs from 1980-now
df = df[df['date'].dt.year > 1979]
df = df[df['peak-rank'] <= 40]

#rename columns, notice there are no song attributes/genre... need to grab from spotify api
df = df.rename(columns={"weeks-on-board": "weeksOnBoard", "peak-rank": "peakRank"})

#let's use the incomplete results from our last tries to save api calls
attributes = collections.defaultdict(list)
incompleteAtt, incompleteGenre = helpers.att, helpers.g

#let's keep track of num unique artists, use as stopping condition
uniqueArtists = set()

#map to keep track of song genres, keys will be artists
genres = {}

for key in incompleteAtt.keys():
	curr = incompleteAtt[key]
	uniqueArtists.add(key[0])

	if key[0] not in genres:
		genres[key[0]] = incompleteGenre[key[0]]

	if not curr:
		continue

	#using song objects (artist, song) as keys in the attributes map
	if len(curr) > 1:
		attributes[key] = [curr[0], curr[1], curr[2], curr[3]]
	else:
		attributes[key] = [curr[0][0], curr[0][1], curr[0][2], curr[0][3]]

#get spotify auth token
clientID = "837c3592e7554c378b5233f97ffd9f37"
clientSecret = "ca64e353952746fbbbf2cd7e15cda9f2"

authResponse = requests.post("https://accounts.spotify.com/api/token", {
    'grant_type': 'client_credentials',
    'client_id': clientID,
    'client_secret': clientSecret,
})

authResponseData = authResponse.json()
token = authResponseData['access_token']

#list of ids
artistIDs, trackIDs = [], []
#lists of songs, so we can match ids with songs when making bulk api calls
artists, tracks = [], []

#this block is looping until every song has its attributes/genre collected
#some songs have no data in the api, so their corresponding vals will be NaN
while len(uniqueArtists) > len(genres):
	
	for song, row in df.iterrows():
		if song in attributes and song[0] in genres:
			continue
		
		#header for api calls
		headers = {
			'Authorization': 'Bearer {token}'.format(token=token)
		}

		#first, prepare search term for spotify
		artist, track = helpers.removeBadTerms(song[0]), song[1]
		searchTerm = urllib.parse.quote_plus(track + " " + artist)

		#try the spotify search get request
		try:
			searchResponse = requests.get('https://api.spotify.com/v1/search?q=' + searchTerm + '&type=track', headers = headers)
			searchJSON = None if not searchResponse else searchResponse.json()

		except requests.exceptions.HTTPError as err:
			print(song, " ERROR: ", err.response.text) 
			
			if err.response.status_code != 429:
				attributes[song] = [np.nan, np.nan, np.nan, np.nan]
				genres[song] = ""
				continue

		#null check search response data
		if searchJSON and searchJSON['tracks']['items']:
			artistID, trackID = searchJSON['tracks']['items'][0]['artists'][0]['id'], searchJSON['tracks']['items'][0]['id']
			
			#building up these lists of ids so we can do bulk api calls
			#second list of each block helps keep track of each id's respective song objects
			if song[0] not in genres and song not in artists and artistID not in artistIDs:
				artistIDs.append(artistID)
				artists.append(song[0])
			
			if song not in attributes and song not in tracks:
				trackIDs.append(trackID)
				tracks.append(song)

			if len(artistIDs) == 50 or len(trackIDs) == 50 or len(uniqueArtists) - len(genres) == len(artistIDs):

				#this request grabs the artist's genres (no support for track genre in spotify api)
				try:
					artistResponse = requests.get('https://api.spotify.com/v1/artists?ids=' + ",".join(artistIDs), headers=headers)
					artistJSON = None if not artistResponse else artistResponse.json()
					
					if artistJSON and artistJSON['artists']:
						for i, artist in enumerate(artistJSON['artists']):
							if artist:
								genres[artists[i]] = helpers.getBestGenre(artist['genres'])

					artistIDs.clear()
					artists.clear()

					print(len(uniqueArtists) - len(genres), " song genres left to assign")

				except requests.exceptions.HTTPError as err:
					print(song, " ERROR: ", err.response.text) 
					break

				#this request grabs track attributes
				try:
					#this api call will give a HTTP200 response even w empty query... lets avoid that unneeded call if we can
					trackResponse = None if not trackIDs else requests.get('https://api.spotify.com/v1/audio-features?ids=' + ",".join(trackIDs), headers=headers)
					trackJSON = None if not trackResponse else trackResponse.json()

					if trackJSON and trackJSON['audio_features']:
						for i, track in enumerate(trackJSON['audio_features']):
							if track:
								attributes[tracks[i]].append(track["danceability"])
								attributes[tracks[i]].append(track["acousticness"])
								attributes[tracks[i]].append(track["valence"])
								attributes[tracks[i]].append(track["loudness"])
							
					trackIDs.clear()
					tracks.clear()

					print(len(df) - len(attributes), " song attributes left to assign")

				except requests.exceptions.HTTPError as err:
					print(song, " ERROR: ", err.response.text) 
					break

		else:
			#attributes[song] = [np.nan, np.nan, np.nan, np.nan]
			genres[song[0]] = ""
			continue

	print(len(df) - len(attributes), " remaining tracks to complete...\n")

print(attributes)
print(genres)

genre, danceability, acousticness, valence, loudness = [], [],[],[],[]
for song, row in df.iterrows():
		
		#remember, genre map has artist as keys
		if song[0] in genres:
			genre.append(genres[song[0]])
		else:
			genre.append("")

		if song in attributes:
			danceability.append(attributes[song][0])
			acousticness.append(attributes[song][1])
			valence.append(attributes[song][2])
			loudness.append(attributes[song][3])
		else:
			danceability.append(np.nan)
			acousticness.append(np.nan)
			valence.append(np.nan)
			loudness.append(np.nan)

df['danceability'] = danceability
df['acousticness'] = acousticness
df['valence'] = valence
df['loudness'] = loudness
df['genre'] = genre

#one last cleaning, remove all rows w empty string (null genres)
df.replace("", np.nan, inplace=True)
df = df.dropna()

df.to_csv("../charts.csv")


