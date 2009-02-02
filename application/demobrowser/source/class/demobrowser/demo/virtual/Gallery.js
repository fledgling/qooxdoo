/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#asset(qx/icon/${qx.icontheme}/16/places/*)
#asset(qx/icon/${qx.icontheme}/22/places/*)
#asset(qx/icon/${qx.icontheme}/32/places/*)
#asset(qx/icon/${qx.icontheme}/48/places/*)
#asset(qx/icon/${qx.icontheme}/64/places/*)
#asset(qx/icon/${qx.icontheme}/128/places/*)

************************************************************************ */

qx.Class.define("demobrowser.demo.virtual.Gallery",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    main : function()
    {
      this.base(arguments);
      
      // widget window
      var widgetWin = new demo.WidgetGallery("Gallery (widgets)");
      
      // html window
      var htmlWin = new demo.HtmlGallery("Gallery (HTML)");
      htmlWin.moveTo(400, 50);                  
    }
  }
});


qx.Class.define("demo.AbstractGallery",
{
  extend : qx.ui.window.Window,
  type : "abstract",
  
  construct : function(title)
  {
    this.base(arguments, title);
    
    this.set({
      contentPadding: 0,
      showClose: false,
      showMinimize: false,
      width: 300,
      height: 400
    });
    this.setLayout(new qx.ui.layout.Grow());
    this.moveTo(30, 50);
    this.open();
    
    this.itemHeight = 60;
    this.itemWidth = 60;
    this.itemCount = 431;
    this.itemPerLine = 1;
    this.items = this._generateItems(this.itemCount);    
    
    var scroller = this._createScroller();
    scroller.set({
      scrollbarX: "off",
      scrollbarY: "auto"
    });    
    scroller.pane.addListener("resize", this._onPaneResize, this);    
    this.add(scroller);    
  },
  
  
  members :
  {
    _createScroller : function() {
      // abstract method
    },
    
    _onPaneResize : function(e)
    {
      var pane = e.getTarget();
      var width = e.getData().width;
      
      var colCount = Math.floor(width/this.itemWidth);
      if (colCount == this.itemsPerLine) {
        return;
      }
      this.itemPerLine = colCount;
      var rowCount = Math.ceil(this.itemCount/colCount);
      
      pane.columnConfig.setItemCount(colCount);
      pane.rowConfig.setItemCount(rowCount);
      
      pane.fullUpdate();
    },
    
    
    _generateItems : function(count)
    {
      var items = [];
      var iconImages = [
        "folder.png",
        "user-trash.png",
        "network-server.png",
        "network-workgroup.png",
        "user-desktop.png"
      ];
      
      var aliasManager = qx.util.AliasManager.getInstance();
      var resourceManager = qx.util.ResourceManager;
      
      for (var i=0; i<count; i++)
      {
        var icon = "icon/32/places/" + iconImages[Math.floor(Math.random() * iconImages.length)];
        resolved = aliasManager.resolve(icon);
        url = resourceManager.toUri(resolved);
        
        items[i] = {
          label: "Icon #" + (i+1),
          icon: url
        };
      }
      
      return items;
    }
  }
});


qx.Class.define("demo.WidgetGallery",
{
  extend : demo.AbstractGallery,
  
  construct : function(title)
  {
    this.base(arguments, title);
    
    this._pool = [];
  },  
  
  members : 
  {
    _createScroller : function() 
    {
      var scroller = new qx.ui.virtual.core.Scroller(
        1, this.itemPerLine,
        this.itemHeight, this.itemWidth
      );
      scroller.pane.addLayer(new qx.ui.virtual.layer.WidgetCell(this));
      
      var prefetch = new qx.ui.virtual.behavior.Prefetch(
        scroller,
        0, 0, 0, 0,
        200, 300, 600, 800
      ).set({
        interval: 500
      });
      
      return scroller;
    },
    
    getCellWidget : function(row, column)
    {     
      var itemData = this.items[row * this.itemPerLine + column];

      if (!itemData) {
        return null;
      }
           
      var widget = this._pool.pop() || new qx.ui.basic.Atom().set({
        iconPosition: "top"
      });
      
      widget.set(itemData);

      return widget;
    },
    
    poolCellWidget : function(widget) {
      this._pool.push(widget);
    }    
  }
});


qx.Class.define("demo.HtmlGallery",
{
  extend : demo.AbstractGallery,
  
  construct : function(title)
  {
    this.base(arguments, title);
    
    var fontStyles = qx.theme.manager.Font.getInstance().resolve("default").getStyles();
    this._fontCss = qx.bom.element.Style.compile(fontStyles);    
  },  
  
  members : 
  {
    _createScroller : function() 
    {
      var scroller = new qx.ui.virtual.core.Scroller(
        1, this.itemPerLine,
        this.itemHeight, this.itemWidth
      );
      this.layer = new qx.ui.virtual.layer.HtmlCell(this);
      scroller.pane.addLayer(this.layer);
      
      this.manager = new qx.ui.virtual.selection.Cell(scroller.pane, this).set({
        mode: "multi",
        drag: true
      });  
      this.manager.attachMouseEvents(scroller.pane);
      this.manager.attachKeyEvents(scroller);
      
      return scroller;
    },
    
    
    styleSelectable : function(item, type, wasAdded) {
      qx.ui.core.queue.Widget.add(this.layer);
    },
    
    
    getCellHtml : function(row, column, left, top, width, height)
    {
      var itemData = this.items[row * this.itemPerLine + column];
      
      if (!itemData) {
        return "";
      }
      
      var isSelected = this.manager.isItemSelected({row: row, column: column});
      var color = isSelected ? "color: white; background-color: #00398D;" : "";
      
      var html = [
        "<div style='",
        "float: left;",
        "text-align: center;",
        this._fontCss,
        "width:", width, "px;",
        "height:", height, "px;",
        color,
        "'>",

        "<img src='", itemData.icon, "'></img>",
        "<br>",
        
        itemData.label,
        "</div>"                  
      ];
      return html.join("");
    }          
  }
});