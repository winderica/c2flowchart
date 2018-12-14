TreeNode *getParentHelper(TreeNode *node, int key) {
    if (node == NULL || (node->leftChild && node->leftChild->data.key == key) || (node->rightChild && node->rightChild->data.key == key)) {
        return node;
    }
    TreeNode *parent = getParentHelper(node->leftChild, key);
    if (parent == NULL) {
        parent = getParentHelper(node->rightChild, key);
    }
    return parent;
}
