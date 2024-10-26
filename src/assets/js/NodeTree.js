// First layer: simply Ids
const nodeTree = {
    id: 'a',
    children: [
        {
            id: 'b'
        },
        {
            id: 'c'
        }
    ]
}

// Proxy adds a parentId variable
// Also provides functionality to set the parent to something else?
// Using a proxy to set parent references seems like a
// good idea to keep the structure consistent
const nodeTreeParent = {
    id: 'a',
    parentId: null,
    children: [
        {
            id: 'b',
            parentId: 'a'
        },
        {
            id: 'c',
            parentId: 'a'
        }
    ]
}

// Proxy to map the id's to actual object references
// Proxy to handle shallow copy on write.
// Whenever an original value is adjusted,
// node is copied and the map is adjusted such that id's reference a different node
// Since the proxy looks it up in the map each time, the references are immediately updated