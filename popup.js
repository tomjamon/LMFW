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

    // For Popup
    $( "#lmfw" ).on( "click", ".details", function() {
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
    var bookmarkTreeNodes = chrome.bookmarks.getTree(
        function(bookmarkTreeNodes) {
            TreeNodesList = dumpTreeNodes(bookmarkTreeNodes, query);
            if(isCreating){
                loadVue();
                isCreating = false;
            }
            hide_child(TreeNodesList[0]);
        }
    );
    return TreeNodesList[0];
}

function hide_child(array) {
    array['visible'] = false;
    for (var i = 0; i < array["children"].length; i++) {
        if((typeof array["children"][i]["children"] != 'undefined')&&(array["children"][i]["children"].length > 0)) {
            hide_child(array["children"][i]);
        }
        if(array['children'][i]["visible"]){
            array['visible'] = true;
        }
    }
    return true;
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
                "id":bookmarkNode.id,
                "name":bookmarkNode.title,
                "link":bookmarkNode.url,
                "visible": true,
                "children":dumpTreeNodes(bookmarkNode.children, query)
            };
        } else {
            if ((query)
                && ((String(bookmarkNode.title).indexOf(query) == -1)&&(String(bookmarkNode.url).indexOf(query) == -1))) {
                    li = {
                        "id":bookmarkNode.id,
                        "name":bookmarkNode.title,
                        "link":bookmarkNode.url,
                        "visible": false
                    };
            } else {
                li = {
                    "id":bookmarkNode.id,
                    "name":bookmarkNode.title,
                    "link":bookmarkNode.url,
                    "visible": true
                };
            }
        }
        return li;
    }

    function createChild(parentId) {
        chrome.bookmarks.create({
            'parentId': parentId,
            'title': 'new stuff',
            'url': 'http://new-link.com'
        },
        function(result) {
            console.log(result.id);
            var my_result = result.id;
            return my_result;
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        dumpBookmarks();
    });

    function loadVue(){

        Vue.component('item', {
            template: '#item-template',
            props: {
                model: Object,
                treeData : Object
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
                        this.model.visible
                    )
                    /*
                    return (
                        (this.model.children && (this.gotActiveChild))
                        || (this.model.link !== false)
                    )
                     */
                },
                isOpen: function () {
                    if (this.isFolder) {
                        if(this.open){
                            return false;
                        } else {
                            return true;
                        }
                    }
                    return false;
                },
                treeData : TreeNodesList[0]
            },
            methods: {
                toggle: function () {
                    if (this.isFolder) {
                        this.open = !this.open
                    }
                },
                gotActiveChild : function() {
                    visible = false;
                    if ((this.model.children.length >1)) {

                        /*for (child) in (this.model.children) {
                            if (child.visible) {
                                visible = true;
                            }
                        }*/
                        visible = true;
                    }
                    return visible;
                },
                // changeType: function () {
                //     if (!this.isFolder) {
                //         Vue.set(this.model, 'children', [])
                //         this.addChild()
                //         this.open = true
                //     }
                // },
                addChild: function () {
                    this.model.children.push({
                        id: createChild(this.model.id),
                        name: 'new stuff',
                        link: 'http://new-link.com',
                        visible: true
                    })
                },
                removeChild: function(){
                    if (this.isFolder) {
                        chrome.bookmarks.removeTree(this.model.id);
                    } else {
                        chrome.bookmarks.remove(this.model.id);
                    }
                    this.model=null;
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
                    this.treeData = dumpBookmarks($('#search').val());
                    console.log(this.treeData);
                }
            }
        })
        // ----
    }
