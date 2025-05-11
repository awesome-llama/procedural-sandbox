# convert data URL file into something usable with Scratch

import urllib.parse

FILE_SUBSTITUTION = 'bWlzc2luZyBkYXRh'

fragments = ['data:text/html,']

with open('src/data_URL/ply_point_cloud.html', encoding='UTF-8') as f:
    document = f.read()

document = urllib.parse.quote(document)

_split = document.split(FILE_SUBSTITUTION)
if len(_split) != 2: raise Exception('File failed to split into 2')

fragments.append(_split[0])
fragments.append(FILE_SUBSTITUTION)
fragments.append(_split[1])

with open('src/data_URL/fragments_ply_point_cloud.txt', 'w', encoding='UTF-8') as f:
    f.writelines([f"{elem}\n" for elem in fragments])
