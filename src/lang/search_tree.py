

def _optimal_binary_tree(tree, items, weights):

    if len(items) != len(weights):
        raise Exception('items and weights must be the same length')

    if len(items) == 2:
        tree.extend(items)
        return


    # find index of most similar total cost
    # the cost of a group of items is total splits * probability
    # total splits is (n-1)*2

    lowest_index = None
    lowest_cost_difference = float('inf')
    for i in range(1, len(weights)):
        
        total_cost_start = ((i-1)*2) / sum(weights[:i])
        total_cost_end = (((len(weights)-i)-1)*2) / sum(weights[i:])
        # difference for comparison is absolute with additional slight bias for more even branch splits
        # TODO: improve calculation or expose the parameter
        cost_difference = abs(total_cost_start - total_cost_end) + abs((len(weights)/2)-i)/200

        if cost_difference < lowest_cost_difference:
            lowest_index = i
            lowest_cost_difference = cost_difference
    
    i = lowest_index
    
    weights_start = weights[:i]
    weights_end = weights[i:]
    items_start = items[:i]
    items_end = items[i:]

    if len(weights_start) == 1:
        tree.append(items_start[0])
    else:
        tree.append([])
        _optimal_binary_tree(tree[0], items_start, weights_start)
    
    if len(weights_end) == 1:
        tree.append(items_end[0])
    else:
        tree.append([])
        _optimal_binary_tree(tree[1], items_end, weights_end)
    
    return


"""Generate a binary tree from weights, return tree of indices"""
def optimal_binary_tree_from_weights(weights):
    tree = []
    _optimal_binary_tree(tree, list(range(len(weights))), weights)
    return tree


"""Recurse to find the maximum value within nested lists"""
def find_max_item(tree):
    if not isinstance(tree, list):
        return tree

    mi = 0 # max index
    if not isinstance(tree[0], list):
        mi = tree[0]
    else:
        mi = find_max_item(tree[0])

    if not isinstance(tree[1], list):
        mi = max(mi, tree[1])
    else:
        mi = max(mi, find_max_item(tree[1]))

    return mi


"""Preview the depths of each item"""
def print_depths(tree, items):
    indent_symbol = '>'
    def _depth(branch, depth):
        if isinstance(branch[0], list):
            _depth(branch[0], depth+1)
        else:
            print(indent_symbol*depth + ' ' + items[branch[0]])
        
        if isinstance(branch[1], list):
            _depth(branch[1], depth+1)
        else:
            print(indent_symbol*depth + ' ' + items[branch[1]])

    _depth(tree, 0)





if __name__ == '__main__':
    #import json
    #weights = [10,10,10,10,10,15,15,15,15,15,15,15,16,16,20,20,30,30,30,30,30,30,40,40,40,50,50,80,80,80,100,100,100,100,100,200,400,400,400,400,400,500,500,500,500,600,800,2000,2000,2000,2000]

    tree = []
    a = ['a', 'b', 'c', 'd', 'e', 'f']
    w = [65,66,67,80,81,820]

    _optimal_binary_tree(tree, a, w)
    print(tree)
    