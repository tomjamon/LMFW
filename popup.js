// Search the bookmarks when entering the search keyword.
var vm;

$(function() {
    $('#search').change(function() {
        $('#bookmarks').empty();
        loadVue();
        dumpBookmarks($('#search').val());
    });

    $( "#lmfw" ).on( "click", "i", function() {
        if( $(this).attr('data-url')){
            chrome.tabs.create({
                url : $(this).attr('data-url')
            });
        }
    });
});

var TreeNodesList = [];
var isCreating = true;
function dumpBookmarks(query)
{
    console.log("Seaching...");
    var bookmarkTreeNodes = chrome.bookmarks.getTree(
        function(bookmarkTreeNodes) {
            TreeNodesList = dumpTreeNodes(bookmarkTreeNodes, query);
            if(isCreating){
                loadVue();
                isCreating = false;
            }
        }
    );
}

function dumpTreeNodes(bookmarkNodes, query)
{
    //var list = $('<ul>');
    var list = [];
    var i;
    var testIfEmpty;
    for (i = 0; i < bookmarkNodes.length; i++) {
        testIfEmpty = dumpNode(bookmarkNodes[i], query);
        if(testIfEmpty){
            list.push(testIfEmpty);
        }
    }

    return list;
}

var top = [];

function dumpNode(bookmarkNode, query) {

    // Check if title exist, otherway take the url as name
    if (!bookmarkNode.title) {
        if(bookmarkNode.url){
            bookmarkNode.title= bookmarkNode.url;
        }
    }

    if(!bookmarkNode.url){
        bookmarkNode.url= false;
    }

    var anchor = $('<a>');
    anchor.attr('href', bookmarkNode.url);
    anchor.text(bookmarkNode.title);

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

        var li = [];
        if (bookmarkNode.children && bookmarkNode.children.length > 0) {
            li = {
                "name":bookmarkNode.title,
                "link":bookmarkNode.url,
                "children":dumpTreeNodes(bookmarkNode.children, query)
            };
        } else {
            if ((query && !bookmarkNode.children)
                &&((String(bookmarkNode.title).indexOf(query) == -1)
                &&(String(bookmarkNode.url).indexOf(query) == -1))) {
                li = false;
            } else {
                li = {
                    "name":bookmarkNode.title,
                    "link":bookmarkNode.url
                };
            }
        }
        return li;
    }

    document.addEventListener('DOMContentLoaded', function () {
        dumpBookmarks();
    });

    function loadVue(){

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
                },
                isVisible: function () {
                    return (
                        (this.model.children && (this.model.children.length >1))
                        || (this.model.link !== false)
                    )
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
        vm = new Vue({
            el: '#lmfw',
            data: {
                treeData: TreeNodesList[0]
            },
            methods: {
                reload: function() {
                    dumpBookmarks($('#search').val())
                    this.treeData = TreeNodesList[0]
                    console.log(this.treeData);
                }
            }
        })
        // ----
    }
