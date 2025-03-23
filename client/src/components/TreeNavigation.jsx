export default {
    props: ['nodes'],
    render() {
        const renderTree = (nodes) => (
            <ul class="tree-container">
                {nodes.map(node => (
                    <li class="tree-node">
                        <div
                            class="node-label"
                            onClick={() => this.$emit('select', node.id)}
                        >
                            <i class={`iconfont ${node.icon}`}></i>
                            <span>{node.label}</span>
                            {node.count > 0 && (
                                <span class="badge">{node.count}</span>
                            )}
                        </div>
                        {node.children && renderTree(node.children)}
                    </li>
                ))}
            </ul>
        )

        return renderTree(this.$props.nodes)
    }
}