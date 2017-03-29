// Search the bookmarks when entering the search keyword.
$(function() {
    $('#search').change(function() {
        $('#bookmarks').empty();
        dumpBookmarks($('#search').val());
    });
});
var TreeNodesList = [];

// Traverse the bookmark tree, and print the folder and nodes.
function dumpBookmarks(query) {
    var bookmarkTreeNodes = chrome.bookmarks.getTree(
        function(bookmarkTreeNodes) {
            console.log(bookmarkTreeNodes);
            TreeNodesList = dumpTreeNodes(bookmarkTreeNodes, query);
            $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));

            var FinalTreeNodesList = [];

            FinalTreeNodesList.push({
                "name": 'My Treeeeee',
                "link":"http://my-tree.com",
                "children": TreeNodesList
            });

            console.log(TreeNodesList);
            console.log(FinalTreeNodesList);
            //TreeNodesList = $.toJSON(TreeNodesList);
            //console.log(TreeNodesList);

            // ---
            // define the item component
            Vue.component('item', {
                template: '#item-template',
                props: {
                    model: Object
                },
                data: function () {
                    return {
                        open: false
                    }
                },
                computed: {
                    isFolder: function () {
                        return this.model.children &&
                        this.model.children.length
                    }
                },
                methods: {
                    toggle: function () {
                        if (this.isFolder) {
                            this.open = !this.open
                        }
                    },
                    changeType: function () {
                        if (!this.isFolder) {
                            Vue.set(this.model, 'children', [])
                            this.addChild()
                            this.open = true
                        }
                    },
                    addChild: function () {
                        this.model.children.push({
                            name: 'new stuff',
                            link: 'http://new-link.com'
                        })
                    }
                }
            })

            // boot up the demo
            var demo = new Vue({
                el: '#demo',
                data: {
                    treeData: TreeNodesList[0]
                }
            })
            // ----
        }
    );
}

function dumpTreeNodes(bookmarkNodes, query) {
    //var list = $('<ul>');
    var list = [];
    var i;
    for (i = 0; i < bookmarkNodes.length; i++) {
        list.push(dumpNode(bookmarkNodes[i], query));
    }

    return list;
}

var top = [];

function dumpNode(bookmarkNode, query) {
    if (!bookmarkNode.title) {
            if(bookmarkNode.url){
                bookmarkNode.title= "no title";
            }
        }
        if(!bookmarkNode.url){
            bookmarkNode.url= "no link";
        }
        if (query && !bookmarkNode.children) {
            if (String(bookmarkNode.title).indexOf(query) == -1) {
                return $('<span></span>');
            }
        }

        var anchor = $('<a>');
        anchor.attr('href', bookmarkNode.url);
        anchor.text(bookmarkNode.title);
        /*
        * When clicking on a bookmark in the extension, a new tab is fired with
        * the bookmark url.
        */
        anchor.click(function() {
            chrome.tabs.create({url: bookmarkNode.url});
        });

        var span = $('<span>');
        var options = bookmarkNode.children ?
        $('<span>[<a href="#" id="addlink">Add</a>]</span>') :
        $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
        'href="#">Delete</a>]</span>');
        var edit = bookmarkNode.children ? $('<table><tr><td>Name</td><td>' +
        '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
        '</td></tr></table>') : $('<input>');
        // Show add and edit links when hover over.
        span.hover(function() {
            span.append(options);
            // var img = "<img src='"+bookmarkNode.url+"/favicon.png />";
            // span.append(img);
            $('#deletelink').click(function() {
                $('#deletedialog').empty().dialog({
                    autoOpen: false,
                    title: 'Confirm Deletion',
                    resizable: false,
                    height: 140,
                    modal: true,
                    overlay: {
                        backgroundColor: '#000',
                        opacity: 0.5
                    },
                    buttons: {
                        'Yes, Delete It!': function() {
                            chrome.bookmarks.remove(String(bookmarkNode.id));
                            span.parent().remove();
                            $(this).dialog('destroy');
                        },
                        Cancel: function() {
                            $(this).dialog('destroy');
                        }
                    }
                }).dialog('open');
            });
            $('#addlink').click(function() {
                $('#adddialog').empty().append(edit).dialog({
                    autoOpen: false,
                    closeOnEscape: true, title: 'Add New Bookmark', modal: true,
                    buttons: {
                        'Add' : function() {
                            chrome.bookmarks.create({parentId: bookmarkNode.id,
                                title: $('#title').val(), url: $('#url').val()});
                                $('#bookmarks').empty();
                                $(this).dialog('destroy');
                                window.dumpBookmarks();
                            },
                            'Cancel': function() {
                                $(this).dialog('destroy');
                            }
                    }
                }).dialog('open');
            });

            $('#editlink').click(function() {
                edit.val(anchor.text());
                $('#editdialog').empty().append(edit).dialog({autoOpen: false,
                    closeOnEscape: true, title: 'Edit Title', modal: true,
                    show: 'slide', buttons: {
                        'Save': function() {
                            chrome.bookmarks.update(String(bookmarkNode.id), {
                                title: edit.val()
                            });
                            anchor.text(edit.val());
                            options.show();
                            $(this).dialog('destroy');
                        },
                        'Cancel': function() {
                            $(this).dialog('destroy');
                        }
                    }
                }).dialog('open');
            });
            options.fadeIn();
        },
        // unhover
        function() {
            options.remove();
    }).append(anchor);
    // }

    // var li = $(bookmarkNode.url ? '<li>' : '<div>').append(span);
    var li = [];
    if (bookmarkNode.children && bookmarkNode.children.length > 0) {
        li = {
            "name":bookmarkNode.title,
            "link":bookmarkNode.url,
            "children":dumpTreeNodes(bookmarkNode.children, query)
        };
        // li.append(dumpTreeNodes(bookmarkNode.children, query));
    } else {
        li = {
            "name":bookmarkNode.title,
            "link":bookmarkNode.url
        };
    }
    return li;
}
// console.log( JSON.stringify(data) )

// console.log( JSON.parse(TreeNodesList) );
document.addEventListener('DOMContentLoaded', function () {
    dumpBookmarks();
});










// demo data
var data = [{
    name: 'My Treeeeee',
    link:"http://my-tree.com",
    children: [
        { name: 'hello', link:"http://my-tree.com" },
        { name: 'wat', link:"http://my-tree.com" },
        {
            name: 'child folder', link:"http://my-tree.com",
            children: [
                {
                    name: 'child folder', link:"http://my-tree.com",
                    children: [
                        { name: 'hello', link:"http://my-tree.com" },
                        { name: 'wat', link:"http://my-tree.com" }
                    ]
                },
                { name: 'hello', link:"http://my-tree.com" },
                { name: 'wat', link:"http://my-tree.com" },
                {
                    name: 'child folder', link:"http://my-tree.com",
                    children: [
                        { name: 'hello', link:"http://my-tree.com" },
                        { name: 'wat', link:"http://my-tree.com" }
                    ]
                }
            ]
        }
    ]
}];
console.log(data);
