/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2007 1&1 Internet AG, Germany, http://www.1and1.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

qx.Class.define("qx.ui2.core.Widget",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Where to add the children, too
    // Normally the widget itself, but could also be an content pane
    // e.g. for windows, groupboxes, comboboxes, etc.
    this._childContainer = this;

    // Create content element
    this._outerElement = this._createOuterElement();
    this._decorationElement = this._createDecorationElement();
    this._contentElement = this._createContentElement();

    // Border sizes
    this._borderWidthLeft = 0;
    this._borderWidthTop = 0;
    this._borderWidthRight = 0;
    this._borderWidthBottom = 0;

    // Layout data
    this._layoutHints = {};

    // Whether the widget has a layout manager
    this._hasLayout = false;
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    // mouse events
    mousemove : "qx.event.type.Mouse",
    mouseover : "qx.event.type.Mouse",
    mouseout : "qx.event.type.Mouse",
    mousedown : "qx.event.type.Mouse",
    mouseup : "qx.event.type.Mouse",
    click : "qx.event.type.Mouse",
    dblclick : "qx.event.type.Mouse",
    contextmenu : "qx.event.type.Mouse",
    mousewheel : "qx.event.type.Mouse",

    // key events
    keyup : "qx.event.type.KeySequence",
    keydown : "qx.event.type.KeySequence",
    keypress : "qx.event.type.KeySequence",
    keyinput : "qx.event.type.KeyInput",

    // focus events
    focus : "qx.event.type.Event",
    blur : "qx.event.type.Event",
    focusin : "qx.event.type.Event",
    focusout : "qx.event.type.Event",
    beforedeactivate : "qx.event.type.Event",
    beforeactivate : "qx.event.type.Event",
    activate : "qx.event.type.Event",
    deactivate : "qx.event.type.Event",

    // inline events
    scroll : "qx.event.type.Dom",
    change : "qx.event.type.Data",
    input : "qx.event.type.Data",
    load : "qx.event.type.Event",
    select : "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT
    ---------------------------------------------------------------------------
    */

    /** Selected layout of instance {@link qx.ui2.layout.AbstractLayout} */
    layout :
    {
      check : "qx.ui2.layout.AbstractLayout",
      nullable : true,
      init : null,
      apply : "_applyLayout"
    },



    /*
    ---------------------------------------------------------------------------
      PADDING
    ---------------------------------------------------------------------------
    */

    /** Padding of the widget (top) */
    paddingTop :
    {
      check : "Number",
      init : 0,
      apply : "_applyLayoutChange",
      themeable : true
    },


    /** Padding of the widget (right) */
    paddingRight :
    {
      check : "Number",
      init : 0,
      apply : "_applyLayoutChange",
      themeable : true
    },


    /** Padding of the widget (bottom) */
    paddingBottom :
    {
      check : "Number",
      init : 0,
      apply : "_applyLayoutChange",
      themeable : true
    },


    /** Padding of the widget (left) */
    paddingLeft :
    {
      check : "Number",
      init : 0,
      apply : "_applyLayoutChange",
      themeable : true
    },


    /**
     * The 'padding' property is a shorthand property for setting 'paddingTop',
     * 'paddingRight', 'paddingBottom' and 'paddingLeft' at the same time.
     *
     * If four values are specified they apply to top, right, bottom and left respectively.
     * If there is only one value, it applies to all sides, if there are two or three,
     * the missing values are taken from the opposite side.
     */
    padding :
    {
      group : [ "paddingTop", "paddingRight", "paddingBottom", "paddingLeft" ],
      mode  : "shorthand",
      themeable : true
    },





    /*
    ---------------------------------------------------------------------------
      THEMEABLE
    ---------------------------------------------------------------------------
    */

    /**
     * The background color of the rendered widget.
     */
    backgroundColor :
    {
      nullable : true,
      init : "inherit",
      check : "Color",
      apply : "_applyBackgroundColor",
      event : "changeBackgroundColor",
      themeable : true,
      inheritable : true
    },


    /**
     * The color (textColor) style property of the rendered widget.
     */
    textColor :
    {
      nullable : true,
      init : "inherit",
      check : "Color",
      apply : "_applyTextColor",
      event : "changeTextColor",
      themeable : true,
      inheritable : true
    },


    /**
     * The decoration property points to a an instanced, which is responsible
     * for drawing the widget's decoration, e.g. border, background or shadow
     */
    decoration :
    {
      nullable : true,
      init : null,
      apply : "_applyDecoration",
      event : "changeDecoration",
      check : "qx.ui2.decoration.IDecoration",
      themeable : true
    },


    /** The font property describes how to paint the font on the widget. */
    font :
    {
      nullable : true,
      init : "inherit",
      apply : "_applyFont",
      check : "Font",
      event : "changeFont",
      themeable : true,
      inheritable : true
    }
  },





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Map} Event which are dispatched on the outer/content element */
    _eventHints :
    {
      outer :
      {
        // mouse events
        mousemove : 1,
        mouseover : 1,
        mouseout : 1,
        mousedown : 1,
        mouseup : 1,
        click : 1,
        dblclick : 1,
        contextmenu : 1,
        mousewheel : 1,

        // key events
        keyup : 1,
        keydown : 1,
        keypress : 1,
        keyinput : 1,

        // focus events (do bubble)
        focusin : 1,
        focusout : 1,
        beforedeactivate : 1,
        beforeactivate : 1,
        activate : 1,
        deactivate : 1
      },

      content :
      {
        // focus, blur events (do not bubble)
        focus : 1,
        blur : 1,

        // all elements
        scroll : 1,
        select : 1,

        // input elements
        change : 1,
        input : 1,

        // iframe elements
        load : 1
      }
    }
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Used by the layouters to apply coordinates and dimensions.
     *
     * @type member
     * @internal: Only for layout managers
     * @param left {Integer} Any positive integer value for the left position,
     *   always in pixels
     * @param top {Integer} Any positive integer value for the top position,
     *   always in pixels
     * @param width {Integer} Any positive integer value for the width,
     *   always in pixels
     * @param height {Integer} Any positive integer value for the height,
     *   always in pixels
     * @return {void}
     */
    layout : function(left, top, width, height)
    {
      var locationChange = (left !== this._left || top !== this._top);
      var sizeChange = (width !== this._width || height !== this._height);

      if (locationChange)
      {
        this._left = left;
        this._top = top;

        this._outerElement.setStyle("left", left + "px");
        this._outerElement.setStyle("top", top + "px");
      }

      if (sizeChange)
      {
        this._width = width;
        this._height = height;

        this._outerElement.setStyle("width", width + "px");
        this._outerElement.setStyle("height", height + "px");

        // Scrollbars are applied to the content element and does not influence
        // its outer size.
        var insetTop = this.getInsetTop();
        var insetLeft = this.getInsetLeft();
        var insetRight = this.getInsetRight();
        var insetBottom = this.getInsetBottom();

        var innerLeft = insetLeft;
        var innerTop = insetTop;
        var innerWidth = width - insetLeft - insetRight;
        var innerHeight = height - insetTop - insetBottom;

        this._contentElement.setStyle("left", innerLeft + "px");
        this._contentElement.setStyle("top", innerTop + "px");
        this._contentElement.setStyle("width", innerWidth + "px");
        this._contentElement.setStyle("height", innerHeight + "px");

        // Sync style
        // TODO: do style updates in a different queue
        this._syncDecoration(width, height);
      }

      // if the current layout is invalid force a relayout even if the size
      // has not changed
      if (!this.isLayoutValid() || sizeChange)
      {
        var mgr = this.getLayout();
        if (mgr) {
          mgr.layout(width, height);
        }
      }

      // TODO: after doing the layout fire change events
      if (locationChange) {
        this.debug("Location change: " + left +", " + top);
      }

      if (sizeChange) {
        this.debug("Size change: " + width + ", " + height);
      }

      this.markLayoutValid();
    },


    _syncDecoration : function(width, height)
    {
      var decoration = this.getDecoration();
      if (decoration) {
        var decorationHtml = decoration.getHtml(this, width, height);
        this._decorationElement.setAttribute("html", decorationHtml);
      }
    },


    /**
     * Returns the (outer) HTML element.
     *
     * @return {qx.html.Element} The outer HTML element
     */
    getElement : function() {
      return this._outerElement;
    },


    isLayoutRoot : function() {
      return false;
    },


    getParent : function()
    {
      return this._parent;
    },

    setParent : function(parent)
    {
      this._parent = parent;
    },

    invalidateLayout : function()
    {
      qx.ui2.core.LayoutQueue.add(this);
    },

    isLayoutValid : function() {
      return !this._layoutInvalid;
    },

    /**
     * Called by the laypot manager to mark this widget's layout as invalid.
     *
     * @internal
     */
    markLayoutInvalid : function()
    {
      this._layoutInvalid = true;
      var mgr = this.getLayout();
      if (mgr) {
        mgr.invalidate();
      }
    },

    /**
     * After doing the layout, mark the layout as valid.
     */
    markLayoutValid : function()
    {
      this._layoutInvalid = false;
    },

    _applyLayoutChange : function()
    {
      this.invalidateLayout();
    },










    /*
    ---------------------------------------------------------------------------
      PRELIMINARY ELEMENT INTERFACES
    ---------------------------------------------------------------------------
    */

    setHtml : function(value) {
      this._contentElement.setAttribute("html", value);
    },

    getHtml : function(value) {
      return this._contentElement.getAttribute("html");
    },

    setId : function(value) {
      this._outerElement.setAttribute("id", value);
    },

    getId : function(value) {
      this._outerElement.getAttribute("id");
    },






    /*
    ---------------------------------------------------------------------------
      HINTS
    ---------------------------------------------------------------------------
    */

    /**
     * Adds a layout hint.
     *
     * @type member
     * @param name {String} Name of the hint (width, top, minHeight, ...)
     * @param value {var} Any acceptable value (depends on the selected parent layout manager)
     * @return {qx.ui2.core.Widget} This widget (for chaining support)
     */
    addHint : function(name, value)
    {
      this._layoutHints[name] = value;
      this.invalidateLayout();

      return this;
    },


    /**
     * Removes a layout hint.
     *
     * @type member
     * @param name {String} Name of the hint (width, top, minHeight, ...)
     * @return {qx.ui2.core.Widget} This widget (for chaining support)
     */
    removeHint : function(name)
    {
      delete this._layoutHints[name];
      this.invalidateLayout();

      return this;
    },


    /**
     * Returns the value of a specific hint
     *
     * @type member
     * @param name {String} Name of the hint (width, top, minHeight, ...)
     * @return {var|null} Configured value
     */
    getHint : function(name)
    {
      var value = this._layoutHints[name];
      return value == null ? null : value;
    },


    /**
     * Whether this widget has a specific hint
     *
     * @type member
     * @param name {String} Name of the hint (width, top, minHeight, ...)
     * @return {Boolean} <code>true</code> when this hint is defined
     */
    hasHint : function(name) {
      return this._layoutHints[name] != null;
    },


    /**
     * Imports a set of hints. Ideal for initial setup.
     *
     * @type member
     * @param map {Map} Incoming data structure
     * @return {qx.ui2.core.Widget} This widget (for chaining support)
     */
    importHints : function(map)
    {
      var hints = this._layoutHints;

      for (var name in map) {
        hints[name] = map[name];
      }

      this.invalidateLayout();

      return this;
    },







    /*
    ---------------------------------------------------------------------------
      HTML ELEMENT MANAGEMENT
    ---------------------------------------------------------------------------
    */

    /**
     * Create the widget's outer HTML element.
     *
     * @return {qx.html.Element} The outer HTML element
     */
    _createOuterElement : function()
    {
      var el = new qx.html.Element("div");

      el.setStyle("position", "absolute");

      return el;
    },


    /**
     * Create the widget's outer HTML element.
     *
     * @return {qx.html.Element} The outer HTML element
     */
    _createContentElement : function()
    {
      var el = new qx.html.Element("div");

      el.setStyle("position", "absolute");
      el.setStyle("zIndex", 10);
      el.setStyle("overflow", "hidden");

      this._outerElement.add(el);

      return el;
    },


    /**
     * Create the widget's decoration HTML element.
     *
     * @return {qx.html.Element} The decoration HTML element
     */
    _createDecorationElement : function()
    {
      var el = new qx.html.Element("div");
      el.setStyle("zIndex", 5);
      this._outerElement.add(el);

      return el;
    },





    /*
    ---------------------------------------------------------------------------
      EVENT HANDLING
    ---------------------------------------------------------------------------
    */

    // overridden
    addListener : function(type, func, obj)
    {
      var hints = this.self(arguments)._eventHints;

      if (hints.content[type]) {
        this._contentElement.addListener(type, func, obj);
      } else if (hints.outer[type]) {
        this._outerElement.addListener(type, func, obj);
      } else {
        this.base(arguments, type, func, obj);
      }
    },


    // overridden
    removeListener : function(type, func, obj)
    {
      var hints = this.self(arguments)._eventHints;

      if (hints.content[type]) {
        this._contentElement.removeListener(type, func, obj);
      } else if (hints.outer[type]) {
        this._outerElement.removeListener(type, func, obj);
      } else {
        this.base(arguments, type, func, obj);
      }
    },









    /*
    ---------------------------------------------------------------------------
      THEMEABLE PROPERTIES
    ---------------------------------------------------------------------------
    */

    _applyDecoration : function(value, old) {
      qx.ui2.decoration.DecorationManager.getInstance().connect(this._styleDecoration, this, value);
    },


    /**
     * Callback for decoration manager connection
     *
     * @param decoration {qx.ui2.decoration.IDecoration} the decoration object
     */
    _styleDecoration : function(decoration)
    {
      if (this._oldWidth && this._oldHeight) {
        this._syncDecoration(this._oldWidth, this._oldHeight);
      }

      qx.ui2.core.LayoutQueue.add(this);
    },


    _applyBackgroundColor : function(value, old)
    {
      var decoration = this.getDecoration();
      if(decoration !== null) {
        this._styleDecoration();
      }
    },


    _applyTextColor : function(value, old) {
      qx.theme.manager.Color.getInstance().connect(this._styleTextColor, this, value);
    },

    _styleTextColor : function(value)
    {
      if (value) {
        this._outerElement.setStyle("color", value);
      } else {
        this._outerElement.resetStyle("color");
      }
    },



    /*
    ---------------------------------------------------------------------------
      INSET
    ---------------------------------------------------------------------------
    */

    getInsetLeft : function()
    {
      var value = this.getPaddingLeft() || 0;

      if (this.getDecoration()) {
        value += this.getDecoration().getInsetLeft() || 0;
      }

      return value;
    },

    getInsetTop : function()
    {
      var value = this.getPaddingTop() || 0;

      if (this.getDecoration()) {
        value += this.getDecoration().getInsetTop() || 0;
      }

      return value;
    },

    getInsetRight : function()
    {
      var value = this.getPaddingRight() || 0;

      if (this.getDecoration()) {
        value += this.getDecoration().getInsetRight() || 0;
      }

      return value;
    },

    getInsetBottom : function()
    {
      var value = this.getPaddingBottom() || 0;

      if (this.getDecoration()) {
        value += this.getDecoration().getInsetBottom() || 0;
      }

      return value;
    },






    /*
    ---------------------------------------------------------------------------
      LAYOUT
    ---------------------------------------------------------------------------
    */

    _applyLayout : function(value, old)
    {
      this._hasLayout = !!value;

      if (value)
      {
        var children = value.getChildren();
        for (var i=0, l=children.length; i<l; i++)
        {
          this._contentElement.add(children[i].getElement());
          children[i].setParent(this);
        }
      }
    },





    /*
    ---------------------------------------------------------------------------
      PREFERRED SIZE
    ---------------------------------------------------------------------------
    */

    /**
     * The natural way the content would display if no dimensions are applied.
     *
     * For labels and other HTML content this is the simple size of this content.
     * For images the size of the image (without scaling).
     *
     * For children the preferred width of each children positioned in the selected
     * layout when each children has no own dimensions configured.
     *
     * @type member
     * @return {Integer} The preferred content width, always in pixels
     */
    _getPreferredContentWidth : function()
    {
      var layout = this.getLayout();
      if (layout) {
        return layout.getPreferredWidth();
      }
      // default width
      return 100;
    },


    /**
     * The natural way the content would display if no dimensions are applied.
     *
     * For labels and other HTML content this is the simple size of this content.
     * For images the size of the image (without scaling).
     *
     * For children the preferred height of each children positioned in the selected
     * layout when each children has no own dimensions configured.
     *
     * @type member
     * @return {Integer} The preferred content height, always in pixels
     */
    _getPreferredContentHeight : function()
    {
      var layout = this.getLayout();
      if (layout) {
        return layout.getPreferredHeight();
      }
      // default height
      return 50;
    },


    /**
     * The preferred width of this widget (simulates the case
     * when no layout properties have been applied at all)
     *
     * @type member
     * @return {Integer} The preferred width, always in pixels
     */
    getPreferredWidth : function()
    {
      return this._getPreferredContentWidth() +
        this.getInsetLeft() + this.getInsetRight();
    },


    /**
     * The preferred height of this widget (simulates the case
     * when no layout properties have been applied at all)
     *
     * @type member
     * @return {Integer} The preferred height, always in pixels
     */
    getPreferredHeight : function()
    {
      return this._getPreferredContentHeight() +
        this.getInsetTop() + this.getInsetBottom();
    },





    /*
    ---------------------------------------------------------------------------
      MINIMUM SIZE
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the minimum width the content is able to shrink.
     *
     * Normally this depends on the technical minimums of the
     * children or the content in general (HTML, images, ...)
     *
     * @type member
     * @return {Integer} The minimum technical content width, always in pixels
     */
    _getTechnicalMinimumContentWidth : function()
    {
      return 0; //TODO
    },


    /**
     * Returns the minimum height the content is able to shrink.
     *
     * Normally this depends on the technical minimums of the
     * children or the content in general (HTML, images, ...)
     *
     * @type member
     * @return {Integer} The minimum technical content height, always in pixels
     */
    _getTechnicalMinimumContentHeight : function()
    {
      return 0; //TODO
    },


    /**
     * Returns the minium width of the widget
     *
     * This is the minimum content width plus paddings and borders.
     *
     * @type member
     * @return {Integer} The minimum technical width, always in pixels
     */
    getTechnicalMinimumWidth : function()
    {
      return this._getTechnicalMinimunContentWidth() +
        this.getInsetLeft() + this.getInsetRight();
    },


    /**
     * Returns the minium height of the widget
     *
     * This is the minimum content height plus paddings and borders.
     *
     * @type member
     * @return {Integer} The minimum technical height, always in pixels
     */
    getTechnicalMinimumHeight : function()
    {
      return this._getTechnicalMinimumContentHeight() +
        this.getInsetTop() + this.getInsetBottom();
    },







    /*
    ---------------------------------------------------------------------------
      MAXIMUM SIZE
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the maximum width the content is able to grow.
     *
     * Normally this depends on the technical maximums of the
     * children or the content in general (HTML, images, ...)
     *
     * @type member
     * @return {Integer} The maximum technical content width, always in pixels
     */
    _getTechnicalMaximumContentWidth : function()
    {
      return 100; //TODO
    },


    /**
     * Returns the maximum height the content is able to grow.
     *
     * Normally this depends on the technical maximums of the
     * children or the content in general (HTML, images, ...)
     *
     * @type member
     * @return {Integer} The maximum technical content height, always in pixels
     */
    _getTechnicalMaximumContentHeight : function()
    {
      return 100; //TODO
    },


    /**
     * Returns the minium width of the widget
     *
     * This is the maximum content width plus paddings and borders.
     *
     * @type member
     * @return {Integer} The maximum technical width, always in pixels
     */
    getTechnicalMaximumWidth : function()
    {
      return this._getTechnicalMinimunContentWidth() +
        this.getInsetLeft() + this.getInsetRight();
    },


    /**
     * Returns the minium height of the widget
     *
     * This is the maximum content height plus paddings and borders.
     *
     * @type member
     * @return {Integer} The maximum technical height, always in pixels
     */
    getTechnicalMaximumHeight : function()
    {
      return this._getTechnicalMaximumContentHeight() +
        this.getInsetTop() + this.getInsetBottom();
    }
  },






  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function()
  {


  }
});
