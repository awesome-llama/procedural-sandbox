import json
import random
import zipfile
import subprocess
import datetime
import sys

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




    def add_comment_to_target(self, target_name: str, text: str, x=0, y=0, width=200, height=200, minimized=False, blockId=None):
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




    ################################
    #       Common processes       #
    ################################

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
        if not twconfig_comment: raise Exception('Comment not found')

        twconfig_comment['x'] = x
        twconfig_comment['y'] = y
        twconfig_comment['width'] = width
        twconfig_comment['height'] = height



    def add_build_comment(self, header:str|None = None, target_name='_'):
        """Add an informative comment to a sprite"""

        target = self.get_target_by_name(target_name)
        if not target: raise Exception('Target not found')

        try:
            gs_ver = self.project_data['meta']['agent'].removeprefix('goboscript v')
        except:
            gs_ver = '?'

        try:
            git_hash = str(subprocess.check_output(['git', 'describe', '--always']).strip(), encoding='utf-8')
        except:
            git_hash = '?'

        if header: header += '\n======' # separator

        comment_text = "\n".join([
            str(header),
            f'build_date: {datetime.datetime.now(datetime.timezone.utc)}',
            f'approx_json_size: {round(len(serialize_project_json(self.project_data))/1000)/1000} MB',
            f'goboscript_version: {gs_ver}',
            f'python_version: {sys.version_info.major}.{sys.version_info.minor}',
            f'git_hash: {git_hash}',
        ])
        
        self.add_comment_to_target(target_name, comment_text, x=500, width=500, height=600)
        print(comment_text)



