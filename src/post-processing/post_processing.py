import json
import random
import zipfile
import subprocess
import datetime
import sys
import os
import hashlib

import clean_up_blocks

random.seed(0)


def serialize_project_json(project, indent=None):
    return json.dumps(project, ensure_ascii=False, indent=indent, separators=(',', ':'))


def random_id(prefix='', length=12):
    return str(prefix) + "".join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=length))




class ScratchProject:
    """An opened Scratch 3 project"""

    def __init__(self, source_path='project.sb3', destination_path='project_processed.sb3') -> None:
        if source_path == destination_path: raise Exception('Paths are identical')
        self.source_path = source_path
        self.destination_path = destination_path
        self.project_archive = zipfile.ZipFile(source_path, 'r')
        self.project_data: dict = json.loads(self.project_archive.read('project.json'))
        self._additional_assets = []


    def __enter__(self):
        return self


    def __exit__(self, exc_type, exc_value, traceback):
        # Save the project in a new zip file
        if exc_type is None:
            with zipfile.ZipFile(self.destination_path, 'w') as new_archive:
                for item in self.project_archive.infolist():
                    if item.filename == 'project.json':
                        # Substitute project.json with updated version
                        json_data = serialize_project_json(self.project_data)
                        new_archive.writestr('project.json', json_data, zipfile.ZIP_DEFLATED)
                    else:
                        # Copy other files as-is
                        file_data = self.project_archive.read(item.filename)
                        new_archive.writestr(item, file_data)
                
                for item in self._additional_assets:
                    new_archive.writestr(item[0], item[1])

            print(f'saved to {self.destination_path}')
        else:
            print('saving cancelled due to exception')

        self.project_archive.close()



    ################################
    #          Utilities           #
    ################################



    def get_monitor_by_id(self, monitor_id: str) -> dict:
        for monitor in self.project_data.get('monitors', []):
            if monitor.get('id') == monitor_id:
                return monitor
        raise Exception(f'No monitor found with id {monitor_id}')



    def get_target_by_name(self, target_name: str) -> dict:
        for target in self.project_data.get('targets', []):
            if target.get('name') == target_name:
                return target
        raise Exception(f'No target found with name {target_name}')



    def get_costume_by_name(self, target_name: str, costume_name: str) -> dict:
        for costume in self.get_target_by_name(target_name).get('costumes', []):
            if costume.get('name') == costume_name:
                return costume
        raise Exception(f'No costume found with name {target_name}')



    def get_comment_by_id(self, target_name: str, comment_id: str) -> dict:
        comments = self.get_target_by_name(target_name).get('comments', {})
        if comment_id in comments:
            return comments[comment_id]
        raise Exception(f'No comment found with id {comment_id}')



    def add_comment(self, target_name: str, text: str, x=0, y=0, width=200, height=200, minimized=False, blockId=None):
        """Add a comment to a target"""

        target = self.get_target_by_name(target_name)
        if 'comments' not in target: target['comments'] = {}

        target['comments'][random_id()] = {
            'blockId': blockId,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'minimized': minimized,
            'text': text,
        }



    def add_asset(self, file_path):
        asset_hash = None
        with open(file_path, "rb") as f:
            data = f.read()
            asset_hash = hashlib.md5(data).hexdigest()
        
            self._additional_assets.append((asset_hash + os.path.splitext(file_path)[1], data))

        return asset_hash



    ################################
    #       Common processes       #
    ################################


    def list_items_to_numbers(self, list_name, target_name='Stage'):
        """Convert list items that are strings into numbers, if valid as such."""

        target = self.get_target_by_name(target_name)

        list_content = target['lists'][list_name][1]
        for i in range(len(list_content)):
            try:
                list_content[i] = int(list_content[i])
                continue
            except: pass
            
            try:
                list_content[i] = float(list_content[i])
                continue
            except: pass



    def order_sprites(self, order=['_', 'main', 'cmd']):
        """Order the sprites following a list of sprite names. Sprites not in the list will be placed at the end."""

        def _get_layer_number(target: dict):
            if target['name'] == 'Stage':
                return 0
            if target['name'] in order:
                return 1 + order.index(target['name'])
            print(f"unknown layer name: {target['name']}")
            return 1000 # no order given, rank it last

        # order sprites in the editor list
        self.project_data['targets'].sort(key=_get_layer_number)

        # set sprite layer order (the layer as controlled by blocks)
        for i, tgt in enumerate(self.project_data['targets']):
            if tgt['name'] != 'Stage':
                tgt['layerOrder'] = i



    def clean_up_blocks(self):
        """Move the blocks in all the sprites so they don't overlap."""

        for target in self.project_data['targets']:
            clean_up_blocks.clean_target(target)



    def remove_field_text(self):
        """Remove unnecessary strings in some fields"""
        
        fields_updated_count = 0
        for target in self.project_data['targets']:
            for block in target['blocks'].values():
                for field in block.get('fields', {}).values():
                    if isinstance(field, list) and field[0] == 'make gh issue if this bothers u':
                        field[0] = ''
                        fields_updated_count += 1
        print(f'fields updated: {fields_updated_count}')



    def move_turbowarp_comment(self, x=420, y=0, width=560, height=200):
        """Move the TurboWarp config comment"""

        twconfig_comment = self.get_comment_by_id('Stage', 'twconfig')

        twconfig_comment['x'] = x
        twconfig_comment['y'] = y
        twconfig_comment['width'] = width
        twconfig_comment['height'] = height



    def add_build_comment(self, header:str|None = None, target_name='_'):
        """Add an informative comment to a sprite"""

        try:
            gs_ver = self.project_data['meta']['agent'].removeprefix('goboscript ')
        except:
            gs_ver = '?'

        try:
            git_hash = str(subprocess.check_output(['git', 'describe', '--always']).strip(), encoding='utf-8')
        except:
            git_hash = '?'

        if header: header += '\n======' # separator

        comment_text = "\n".join([
            str(header),
            f'project_build_date: {datetime.datetime.now(datetime.timezone.utc)}',
            f'project_git_hash: {git_hash}',
            f'project_approx_json_size: {round(len(serialize_project_json(self.project_data))/1000)/1000} MB',
            f'goboscript_version: {gs_ver}',
            f'python_version: {sys.version_info.major}.{sys.version_info.minor}',
        ])
        
        self.add_comment(target_name, comment_text, x=500, width=500, height=600)
        print(comment_text)




    ################################
    #     TurboWarp extensions     #
    ################################



    def register_extension(self, extension_name: str, extension_URL: str):
        """Add a TurboWarp extension to the project."""

        if 'extensions' not in self.project_data: self.project_data['extensions'] = []
        if extension_name not in self.project_data['extensions']: self.project_data['extensions'].append(extension_name)

        if 'extensionURLs' not in self.project_data: self.project_data['extensionURLs'] = {}
        self.project_data['extensionURLs'][extension_name] = extension_URL
    

    
    def get_custom_block_definition_by_proccode_substring(self, target_name: str, proccode_substring: str) -> tuple:
        """Get the custom block definition id and content as a tuple."""

        blocks = self.get_target_by_name(target_name)['blocks']
        for block_id, block in blocks.items():
            if block['opcode'] != 'procedures_definition': continue
            prototype = blocks[block['inputs']['custom_block'][1]]
            if proccode_substring in prototype['mutation']['proccode']: return (block_id, block)
        raise Exception('Block not found')
    


    def replace_custom_block_definition_script(self, target_name: str, proccode_substring: str, new_blocks: dict):
        """Replace the script under a custom block definition with a new one."""

        blocks = self.get_target_by_name(target_name)['blocks']
        block_id, block = self.get_custom_block_definition_by_proccode_substring(target_name, proccode_substring)

        # disconnect blocks
        old_next_id = blocks[block_id]['next']
        old_next = blocks[old_next_id]
        old_next['parent'] = None
        old_next['topLevel'] = True
        old_next['x'] = block.get('x', 0) + 1000
        old_next['y'] = block.get('y', 0)


        # add new blocks
        blocks |= new_blocks

        next_id = None
        for nb_id, nb in new_blocks.items():
            if nb['parent'] is None:
                next_id = nb_id
                break
        if next_id is None: raise Exception("new_blocks lacks topmost block to connect to (searching for a parent of None)")
        
        blocks[next_id]['parent'] = block_id # reconnect
        blocks[next_id]['topLevel'] = False
        blocks[block_id]['next'] = next_id


