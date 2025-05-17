# convert data URL file into something usable with Scratch

import urllib.parse

FILE_SUBSTITUTION = 'bWlzc2luZyBkYXRh'

def parse_doc(path):
    with open(path, encoding='UTF-8') as f:
        document = f.read()

    document = urllib.parse.quote(document)
    return document


def split_generic(output: list, document: str, delimiter: str):
    _split = document.split(delimiter)
    if len(_split) != 2: raise Exception('File failed to split into 2')

    output.append('data:text/html,' + _split[0])
    output.append(_split[1])



fragments = []

document = parse_doc('src/data_URL/ply_point_cloud.html')
split_generic(fragments, document, FILE_SUBSTITUTION)

document = parse_doc('src/data_URL/obj_surface.html')
split_generic(fragments, document, FILE_SUBSTITUTION)



with open('src/data_URL/fragments.txt', 'w', encoding='UTF-8') as f:
    f.writelines([f"{elem}\n" for elem in fragments])
