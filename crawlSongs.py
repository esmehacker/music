from datetime import datetime

import sys
import glob
import json
import pathlib

date_format = '%d%B%Y.mp3'


def stringify_date(song):
    song['date'] = song['date'].strftime("%d/%m/%Y")
    return song


def file_date(name, dir_path=""):
    try:
        return datetime.strptime(name, date_format)
    except ValueError:
        pass

    path = dir_path + name

    fname = pathlib.Path(path)
    assert fname.exists(), f'No file named {path} :('
    return datetime.fromtimestamp(fname.stat().st_mtime)


if len(sys.argv) != 3 and len(sys.argv) != 4:
    print("Usage: python3 crawlSongs.py <songs-directory> <output-file>")
    sys.exit(1)

favourites = []

if len(sys.argv) > 3:
    with open(sys.argv[3], 'r') as favFile:
        favourites = [line.rstrip('\n') for line in list(favFile)]

www_relative_song_dir = sys.argv[1].strip("/") + "/"
song_dir = "www/" + www_relative_song_dir
out_file_name = "www/" + sys.argv[2].strip("/")

songs = glob.glob(song_dir + "*.mp3")
songs = [song[len(song_dir):] for song in songs]

song_data = [{
    'name': song,
    'date': file_date(song, song_dir),
    'favourite': song in favourites
} for song in songs]

song_data.sort(key=lambda song: song['date'], reverse=True)

data = {
    'songs': [stringify_date(song) for song in song_data]
}

with open(out_file_name, 'w') as out_file:
    json.dump(data, out_file, indent=2)

print(f"Written song name data to {out_file_name}.")
