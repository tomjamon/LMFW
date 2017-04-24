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
    $( "#lmfw" ).on( "click", ".pencil", function() {
        $("#bookmark_id").val( $(this).attr('data-id') );
        $("#bookmark_title").val( $(this).attr('data-title') );
        if ($(this).attr('data-link')) {
            $("#bookmark_link").val( $(this).attr('data-link') );
        } else {
            $("#bookmark_link").hide();
        }
        $('.ui.modal').modal('show');
    });

    $( ".modal" ).on( "click", ".positive", function() {
        chrome.bookmarks.update( $("#bookmark_id").val(), {
            title: $("#bookmark_title").val(),
            url: $("#bookmark_link").val()
        });
        $('.ui.modal').modal('hide');
        location.reload();
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

function dumpNode(bookmarkNode, query)
{

    // Check if title exist, otherway take the url as name
    if (!bookmarkNode.title) {
        if(bookmarkNode.url){
            bookmarkNode.title= bookmarkNode.url;
        }
    }

    if (!bookmarkNode.url) {
        bookmarkNode.url= false;
    }

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
        if ((query) && ((String(bookmarkNode.title).indexOf(query) == -1)&&(String(bookmarkNode.url).indexOf(query) == -1))) {
            li = {
                "id":bookmarkNode.id,
                "name":bookmarkNode.title,
                "link":bookmarkNode.url,
                "children": [],
                "visible": false
            };
        } else {
            li = {
                "id":bookmarkNode.id,
                "name":bookmarkNode.title,
                "link":bookmarkNode.url,
                "children": [],
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
        var my_result = result.id;
        return my_result;
    });
    location.reload();
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
                if (!this.model.link) {
                    return 1;
                } else {
                    return this.model.children &&
                    this.model.children.length
                }
            },
            isVisible: function () {
                return (
                    this.model.visible
                )
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
            }
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
                    visible = true;
                }
                return visible;
            },
            CreateNewChild : function() {
                return createChild(this.model.id);
            },
            addChild: function () {
                this.newId = createChild(this.model.id);
                this.$nextTick(function() {
                    this.model.children.push({
                        id: this.newId,
                        name: 'new stuff',
                        link: 'http://new-link.com',
                        visible: true
                    })
                });

                // return newId;
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

    vm = new Vue({
        el: '#lmfw',
        data: {
            treeData: TreeNodesList[0]
        },
        methods: {
            reload: function() {
                this.treeData = dumpBookmarks($('#search').val());
            }
        }
    })
}
