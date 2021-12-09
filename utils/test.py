import requests
import json
import numpy as np

a = np.array([np.nan])
b = [np.nan]
c = [1]
d = np.array([1])

print((a==c).any())

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

headers = {
			'Authorization': 'Bearer {token}'.format(token=token)
}

trackIDs = []

try:
    trackResponse = requests.get('https://api.spotify.com/v1/audio-features?ids=' + ",".join(trackIDs), headers=headers)
    trackJSON = None if not trackResponse else trackResponse.json()

    if trackJSON:
        print("shit")
        for i, track in enumerate(trackJSON['audio_features']):
            if track: print(track[1]) 
           

    print("done")
except requests.exceptions.HTTPError as err:
    print(song, " ERROR: ", err.response.text) 
    