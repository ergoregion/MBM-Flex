import pickle
import sys
import os
import pandas as pd
import json
import math
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QGraphicsView, QGraphicsScene,
    QGraphicsRectItem, QGraphicsItem, QGraphicsLineItem, QGraphicsEllipseItem, QMessageBox
)
from PySide6.QtCore import Qt, QRectF, QLine, QLineF, QPointF
from PySide6.QtGui import QPainter, QPen, QColor, QAction, QContextMenuEvent, QBrush
from PySide6.QtWidgets import QGraphicsTextItem, QDockWidget
from PySide6.QtWidgets import QMenu, QWidget, QComboBox, QSlider
from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton
from PySide6.QtWidgets import QFileDialog, QSizePolicy

from model import SimpleEdge, SimpleGraph, SimpleNode

class EdgeEditorDialog(QDialog):
    def __init__(self, edge, parent=None):
        super().__init__(parent)
        self.edge = edge
        self.setWindowTitle("Edit Edge")
        self.setMinimumWidth(250)

        layout = QVBoxLayout()
        self.name_edit = QLineEdit(edge.name)
        layout.addWidget(QLabel("Edge Name:"))
        layout.addWidget(self.name_edit)

        save_btn = QPushButton("Save")
        save_btn.clicked.connect(self.accept)
        layout.addWidget(save_btn)

        self.setLayout(layout)

    def getNewName(self):
        text = self.name_edit.text().strip()
        return text if text else None
    
class NodeEditorDialog(QDialog):
    def __init__(self, node, parent=None):
        super().__init__(parent)
        self.node = node
        self.setWindowTitle("Edit Room")
        self.setMinimumWidth(250)

        layout = QVBoxLayout()
        self.name_edit = QLineEdit(node.name)
        layout.addWidget(QLabel("Room Name:"))
        layout.addWidget(self.name_edit)

        save_btn = QPushButton("Save")
        save_btn.clicked.connect(self.accept)
        layout.addWidget(save_btn)

        self.setLayout(layout)

    def getNewName(self):
        return self.name_edit.text().strip()


def save_graph_to_file(graph: SimpleGraph, parent_widget=None):
    path, _ = QFileDialog.getSaveFileName(parent_widget, "Save Graph", "", "Graph JSON (*.json)")
    if path:
        with open(path, "w") as f:
            json.dump(graph.to_dict(), f, indent=2)

def load_dataframes_from_pickles(parent_widget=None) -> SimpleGraph | None:
    path, _ = QFileDialog.getOpenFileName(parent_widget, "Load results", "", "results pkl (*.pkl)")
    if path:
        with open(path, "rb") as f:
            return pickle.load(f)
    return None
    

def load_graph_from_file(parent_widget=None) -> SimpleGraph | None:
    path, _ = QFileDialog.getOpenFileName(parent_widget, "Load Graph", "", "Graph JSON (*.json)")
    if path:
        with open(path, "r") as f:
            data = json.load(f)
            return SimpleGraph.from_dict(data)
    return None

class EdgeIndicator(QGraphicsRectItem):
    def __init__(self, rect, parent_edge):
        super().__init__(rect)
        self.parent_edge = parent_edge
        self.setAcceptHoverEvents(True)
        self.setAcceptedMouseButtons(Qt.RightButton)
        self.setBrush(Qt.red)
        self.setPen(Qt.NoPen)
        self.setZValue(100)  # VERY important!

    def mousePressEvent(self, event):
        if event.button() == Qt.RightButton:
            # Call parent's contextMenuEvent properly:
            if self.parent_edge:
                # Create a QContextMenuEvent to pass to parent edge
                context_event = QContextMenuEvent(QContextMenuEvent.Mouse, event.pos(), event.screenPos())
                self.parent_edge.contextMenuEvent(context_event)
                event.accept()
            else:
                super().mousePressEvent(event)
        else:
            super().mousePressEvent(event)

class ResizeHandle(QGraphicsRectItem):
    SIZE = 10

    def __init__(self, parent):
        super().__init__(parent)
        self.setRect(0, 0, self.SIZE, self.SIZE)
        self.setBrush(QColor("white"))
        self.setCursor(Qt.CursorShape.SizeFDiagCursor)
        self.setZValue(2)
        self.setFlags(QGraphicsItem.GraphicsItemFlag.ItemIsMovable |
                      QGraphicsItem.GraphicsItemFlag.ItemIgnoresTransformations)

    def mouseMoveEvent(self, event):
        new_pos = self.mapToParent(event.pos())
        rect = self.parentItem().rect()
        min_width = 50
        min_height = 20
        new_width = max(new_pos.x() - rect.left(), min_width)
        new_height = max(new_pos.y() - rect.top(), min_height)
        self.parentItem().setRect(rect.left(), rect.top(), new_width, new_height)
        self.setPos(rect.left() + new_width - self.SIZE, rect.top() + new_height - self.SIZE)
        for edge in self.parentItem().edges:
            edge.adjust()

    def updatePosition(self):
        rect = self.parentItem().rect()
        self.setPos(rect.right() - self.SIZE, rect.bottom() - self.SIZE)
  
class ViewClass(QGraphicsView):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setDragMode(QGraphicsView.RubberBandDrag)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.setRenderHint(QPainter.Antialiasing)

        self.s = SceneClass()
        self.setScene(self.s)

        self.edge_drag_start_node = None
        self.temp_edge_line = None

    def mousePressEvent(self, event):
        pos = self.mapToScene(event.position().toPoint())
        items = self.scene().items(pos)

        if event.button() == Qt.RightButton:
            for item in items:
                if isinstance(item, Node):
                    # Start edge drag
                    self.edge_drag_start_node = item
                    self.temp_edge_line = QGraphicsLineItem(QLineF(pos, pos))
                    pen = QPen(Qt.blue, 2, Qt.DashLine)
                    self.temp_edge_line.setPen(pen)
                    self.scene().addItem(self.temp_edge_line)
                    # Disable moving this node during edge drag
                    item.setFlag(QGraphicsItem.ItemIsMovable, False)
                    return  # consume event to block node move

        # Left click or other: normal processing (allow node move)
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if self.edge_drag_start_node and self.temp_edge_line:
            pos = self.mapToScene(event.position().toPoint())
            line = QLineF(self.edge_drag_start_node.pos(), pos)
            self.temp_edge_line.setLine(line)
            return  # consume event, block node move

        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        if self.edge_drag_start_node and self.temp_edge_line:
            pos = self.mapToScene(event.position().toPoint())
            items = self.scene().items(pos)
            dest_node = None
            for item in items:
                if isinstance(item, Node) and item is not self.edge_drag_start_node:
                    dest_node = item
                    break

            self.scene().removeItem(self.temp_edge_line)
            self.temp_edge_line = None

            if dest_node:
                edge = Edge(self.edge_drag_start_node, dest_node)
                self.scene().addItem(edge)
                se = SimpleEdge(self.edge_drag_start_node.model, dest_node.model)
                self.scene().graph.edges.append(se)
                edge.bind_model(se)
                edge.adjust()

            # Re-enable moving on start node
            self.edge_drag_start_node.setFlag(QGraphicsItem.ItemIsMovable, True)
            self.edge_drag_start_node = None
            return  # consume event

        super().mouseReleaseEvent(event)  

    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Delete:
            self.deleteSelectedItems()
        else:
            super().keyPressEvent(event)

    def deleteSelectedItems(self):
        selected = self.scene().selectedItems()
        if not selected:
            return
        from PySide6.QtWidgets import QMessageBox
        reply = QMessageBox.question(self, "Confirm Delete",
                                     f"Delete {len(selected)} selected item(s)?",
                                     QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            for item in selected:
                # Remove edges from nodes if needed
                if hasattr(item, 'edges'):
                    for edge in item.edges[:]:
                        self.scene().removeItem(edge)
                        self.scene().graph.edges.remove(edge.model)
                        if hasattr(edge.source, 'edges'):
                            edge.source.edges.remove(edge)
                        if hasattr(edge.dest, 'edges'):
                            edge.dest.edges.remove(edge)
                self.scene().removeItem(item)
                if item.model in self.scene().graph.nodes: self.scene().graph.nodes.remove(item.model)
                if item.model in self.scene().graph.edges: self.scene().graph.edges.remove(item.model)

class SceneClass(QGraphicsScene):
    grid = 30

    def __init__(self, parent=None):
        super().__init__(QRectF(-1000, -1000, 2000, 2000), parent)
        self.graph = SimpleGraph()
        self.results = None

    def drawBackground(self, painter, rect):
        painter.fillRect(rect, QColor(30, 30, 30))
        left = int(rect.left()) - int((rect.left()) % self.grid)
        top = int(rect.top()) - int((rect.top()) % self.grid)
        right = int(rect.right())
        bottom = int(rect.bottom())
        lines = []
        for x in range(left, right, self.grid):
            lines.append(QLine(x, top, x, bottom))
        for y in range(top, bottom, self.grid):
            lines.append(QLine(left, y, right, y))
        painter.setPen(QPen(QColor(50, 50, 50)))
        painter.drawLines(lines)

    def mouseDoubleClickEvent(self, event):
        items = self.items(event.scenePos())
        for item in items:
            if isinstance(item, Node):
                # Double-clicked inside an existing room: open edit dialog
                item.openEditDialog()
                return  # stop here, no new node created

        # No existing node clicked: create a new one
        node = Node()
        self.addItem(node)
        node.setPos(event.scenePos())

        sn = SimpleNode(node.name, node.pos().x(), node.pos().y())
        self.graph.nodes.append(sn)
        node.bind_model(sn)

        super().mouseDoubleClickEvent(event)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.RightButton:
            if len(self.selectedItems()) == 2:
                edge = Edge(self.selectedItems()[0], self.selectedItems()[1])
                self.addItem(edge)
                se = SimpleEdge(self.selectedItems()[0].model, self.selectedItems()[1].model)
                self.model.edges.append(se)
                self.graph.edges.append(se)
                edge.bind_model(se)
                edge.adjust()
        super().mousePressEvent(event)

    def contextMenuEvent(self, event):
        items = self.items(event.scenePos())
        if not items:

            menu = QMenu()
            add_room_action = QAction("Add Room")
            menu.addAction(add_room_action)

            action = menu.exec(event.screenPos())
            if action == add_room_action:
                node = Node()
                self.addItem(node)
                node.setPos(event.scenePos())
                sn = SimpleNode(node.name, node.pos().x(), node.pos().y())
                self.graph.nodes.append(sn)
                node.bind_model(sn)
        else:
            # Pass event to the topmost item under cursor so their contextMenuEvent fires
            items[0].contextMenuEvent(event)



class Node(QGraphicsRectItem):
    _id_counter = 1  # Class variable for unique naming

    def __init__(self, rect=QRectF(-75, -15, 150, 30), parent=None):
        super().__init__(rect, parent)
        self.edges = []
        self.setZValue(1)
        self.setBrush(QColor("darkgray"))
        self.setFlags(
            QGraphicsItem.GraphicsItemFlag.ItemIsMovable |
            QGraphicsItem.GraphicsItemFlag.ItemIsSelectable |
            QGraphicsItem.GraphicsItemFlag.ItemSendsGeometryChanges |
            QGraphicsItem.GraphicsItemFlag.ItemIsFocusable
        )

        # Unique name
        self.name = f"Room {Node._id_counter}"
        Node._id_counter += 1

        # Label
        self.label = QGraphicsTextItem(self.name, self)
        self.label.setDefaultTextColor(QColor("white"))
        self.label.setZValue(3)
        self.label.setTextInteractionFlags(Qt.TextInteractionFlag.NoTextInteraction)
        self.updateLabelPosition()

        # Resize handle
        self.handle = ResizeHandle(self)
        self.handle.setZValue(2)
        self.handle.hide()

    def bind_model(self, simple_node: SimpleNode):
        self.model = simple_node

    def addEdge(self, edge):
        self.edges.append(edge)

    def itemChange(self, change, value):
        if change == QGraphicsItem.GraphicsItemChange.ItemSelectedChange:
            if value:
                self.setBrush(QColor("green"))
                self.handle.show()
                self.handle.updatePosition()
            else:
                self.setBrush(QColor("darkgray"))
                self.handle.hide()

        if change == QGraphicsItem.GraphicsItemChange.ItemPositionHasChanged:
            for edge in self.edges:
                edge.adjust()
            self.handle.updatePosition()
            self.updateLabelPosition()
            if hasattr(self, 'model'):
                self.model.x = self.pos().x()
                self.model.y = self.pos().y()

        return super().itemChange(change, value)

    def setRect(self, x, y, w, h):
        super().setRect(x, y, w, h)
        self.handle.updatePosition()
        self.updateLabelPosition()
        if hasattr(self, 'model'):
            self.model.width = w
            self.model.height = h

    def updateLabelPosition(self):
        rect = self.rect()
        text_rect = self.label.boundingRect()
        x = rect.center().x() - text_rect.width() / 2
        y = rect.center().y() - text_rect.height() / 2
        self.label.setPos(x, y)

    def contextMenuEvent(self, event):
        menu = QMenu()
        edit_action = QAction("Edit…")
        rename_action = QAction("Quick Rename")
        delete_action = QAction("Delete")

        menu.addAction(edit_action)
        menu.addAction(rename_action)
        menu.addAction(delete_action)

        action = menu.exec(event.screenPos())

        if action == edit_action:
            self.openEditDialog()
        elif action == rename_action:
            self.enableRename()
        elif action == delete_action:
            self.deleteNode()

    def enableRename(self):
        self.label.setTextInteractionFlags(Qt.TextInteractionFlag.TextEditorInteraction)
        self.label.setFocus()

    def focusOutEvent(self, event):
        self.label.setTextInteractionFlags(Qt.TextInteractionFlag.NoTextInteraction)
        self.name = self.label.toPlainText().strip() or self.name
        self.label.setPlainText(self.name)
        self.updateLabelPosition()
        super().focusOutEvent(event)

    def deleteNode(self):
        for edge in self.edges[:]:  # copy to avoid mutation during iteration
            self.scene().removeItem(edge)
        self.scene().removeItem(self)

    def openEditDialog(self):
        dialog = NodeEditorDialog(self)
        if dialog.exec():
            new_name = dialog.getNewName()
            if new_name:
                self.name = new_name
                self.label.setPlainText(self.name)
                self.updateLabelPosition()
 
class EdgeIndicatorCircle(QGraphicsEllipseItem):
    def __init__(self, center: QPointF, radius: float, parent_edge):
        super().__init__(-radius, -radius, radius * 2, radius * 2)
        self.setBrush(Qt.red)
        self.setPen(Qt.NoPen)
        self.setZValue(100)
        self.setPos(center)
        self.setAcceptHoverEvents(True)
        self.setAcceptedMouseButtons(Qt.RightButton)
        self.parent_edge = parent_edge

    def contextMenuEvent(self, event):
        if hasattr(self.parent_edge, "contextMenuEvent"):
            self.parent_edge.contextMenuEvent(event)

class Edge(QGraphicsLineItem):
    def __init__(self, source, dest, parent=None):
        super().__init__(parent)
        self.source = source
        self.dest = dest
        self.source.addEdge(self)
        self.dest.addEdge(self)
        self.name = None

        self.pen = QPen(Qt.red, 4)  # Thicker edge line
        self.setPen(self.pen)

        self.indicator_circle = None  # replaces old indicator_rect

    
    def bind_model(self, simple_edge: SimpleEdge):
        self.model = simple_edge

    def adjust(self):
        self.prepareGeometryChange()

        source_center = self.source.mapToScene(self.source.rect().center())
        dest_center = self.dest.mapToScene(self.dest.rect().center())
        line = QLineF(source_center, dest_center)

        # Get intersection points on each node's rectangle
        p1 = self._intersectNodeEdge(self.source, line)
        p2 = self._intersectNodeEdge(self.dest, QLineF(dest_center, source_center))

        if not p1 or not p2:
            p1 = source_center
            p2 = dest_center

        edge_length = QLineF(p1, p2).length()

        if edge_length < 15:
            self.setLine(QLineF(p1, p1))  # visually hide line
            midpoint = (p1 + p2) / 2
            self.showIndicatorCircle(midpoint)
        else:
            self.setLine(QLineF(p1, p2))
            self.removeIndicatorCircle()

    def _intersectNodeEdge(self, node, line: QLineF) -> QPointF | None:
        rect = node.mapToScene(node.rect()).boundingRect()
        corners = [
            QPointF(rect.left(), rect.top()),
            QPointF(rect.right(), rect.top()),
            QPointF(rect.right(), rect.bottom()),
            QPointF(rect.left(), rect.bottom()),
        ]

        for i in range(4):
            edge_line = QLineF(corners[i], corners[(i + 1) % 4])
            intersect_type, point = line.intersects(edge_line)
            if intersect_type == QLineF.BoundedIntersection:
                return point
        return None

    def _rectDistance(self, rect1: QRectF, rect2: QRectF) -> float:
        # If they intersect, distance is zero
        if rect1.intersects(rect2):
            return 0.0

        # Horizontal and vertical gaps
        dx = max(rect1.left() - rect2.right(), rect2.left() - rect1.right(), 0)
        dy = max(rect1.top() - rect2.bottom(), rect2.top() - rect1.bottom(), 0)

        return (dx ** 2 + dy ** 2) ** 0.5
    
    def closestSidePoint(self, node, toward_point):
        """Return the closest edge midpoint of node's rect to toward_point."""
        rect = node.mapToScene(node.rect()).boundingRect()
        sides = {
            'left': QPointF(rect.left(), rect.center().y()),
            'right': QPointF(rect.right(), rect.center().y()),
            'top': QPointF(rect.center().x(), rect.top()),
            'bottom': QPointF(rect.center().x(), rect.bottom()),
        }
        return min(sides.values(), key=lambda p: (p - toward_point).manhattanLength())

    def showIndicatorCircle(self, center: QPointF):
        radius = 6
        if self.indicator_circle:
            self.scene().removeItem(self.indicator_circle)
        
        self.indicator_circle = EdgeIndicatorCircle(center, radius, self)
        if self.scene():
            self.scene().addItem(self.indicator_circle)

    def removeIndicatorCircle(self):
        if self.indicator_circle and self.scene():
            self.scene().removeItem(self.indicator_circle)
        self.indicator_circle = None

    def contextMenuEvent(self, event):
        menu = QMenu()
        edit_action = QAction("Edit Edge")
        delete_action = QAction("Delete Edge")
        menu.addAction(edit_action)
        menu.addAction(delete_action)
        action = menu.exec(event.screenPos())

        if action == edit_action:
            self.openEditDialog()
        elif action == delete_action:
            self.deleteEdge()

    def openEditDialog(self):
        dialog = EdgeEditorDialog(self)
        if dialog.exec():
            new_name = dialog.getNewName()
            if new_name is not None:
                self.name = new_name
                if hasattr(self, "label"):
                    self.label.setPlainText(self.name)
                if hasattr(self, "model"):
                    self.model.name = new_name
                self.adjust()

    def deleteEdge(self):
        if self.source and self in self.source.edges:
            self.source.edges.remove(self)
        if self.dest and self in self.dest.edges:
            self.dest.edges.remove(self)
        self.removeIndicatorCircle()
        self.scene().removeItem(self)


from PySide6.QtGui import QColor, QLinearGradient, QGradient

class ControlPanelWidget(QWidget):
    def __init__(self, scene, parent=None):
        super().__init__(parent)
        self.scene = scene

        layout = QHBoxLayout(self)
        self.setLayout(layout)

        # Gradient options
        self.gradient_combo = QComboBox()
        self.gradient_combo.addItems(["ironbow", "Rainbow", "Blue-Red", "Green-Yellow", "Purple-Orange", "Black-White"])
        layout.addWidget(QLabel("Color Gradient:"))
        layout.addWidget(self.gradient_combo)

        
        self.species_combo = QComboBox()
        self.species_combo.addItems(["", "O3", "CO"])
        self.species_combo.setEditable(True)
        self.species_combo.lineEdit().editingFinished.connect(self.add_species_if_new)
        self.species_combo.setMinimumWidth(150)
        layout.addWidget(QLabel("Species:"))
        layout.addWidget(self.species_combo)

        self.time_slider = QSlider(Qt.Horizontal)
        self.time_slider.setRange(0, 1)
        self.time_slider.setValue(0)
        self.time_label = QLabel("Time: 0")
        layout.addWidget(self.time_label)
        layout.addWidget(self.time_slider)

        self.gradient_combo.currentIndexChanged.connect(self.update_node_colors)
        self.species_combo.currentIndexChanged.connect(self.update_node_colors)
        self.time_slider.valueChanged.connect(self.on_time_changed)

        self.update_node_colors()

    def add_species_if_new(self):
        text = self.species_combo.currentText()
        if text and self.species_combo.findText(text) == -1:
            self.species_combo.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
            self.species_combo.addItem(text)
        self.update_node_colors()

    def on_time_changed(self, value):
        self.time_label.setText(f"Time: {value}")
        self.update_node_colors()

    def get_gradient_colors(self, name):
        if name == "Rainbow":
            return [
                QColor("dark blue"),         
                QColor("blue"),     
                QColor("green"),
                QColor("yellow" ),
                QColor("red" ),
                QColor("white" )
            ]
        elif name == "Blue-Red":
            return [QColor("blue"), QColor("red")]
        elif name == "Black-White":
            return [QColor("black"), QColor("white")]
        elif name == "Green-Yellow":
            return [QColor("green"), QColor("yellow")]
        elif name == "Purple-Orange":
            return [QColor("purple"), QColor("orange")]
        elif name == "ironbow":
            return [
                QColor("black"),         
                QColor("dark magenta"),    
                QColor("orange" ),
                QColor("white" )
            ]
        else:
            return [QColor("darkgray")]

    def interpolate_color(self, color1: QColor, color2: QColor, t: float) -> QColor:
        """Linear interpolate between two QColor (t in [0,1])."""
        r = color1.red() + (color2.red() - color1.red()) * t
        g = color1.green() + (color2.green() - color1.green()) * t
        b = color1.blue() + (color2.blue() - color1.blue()) * t
        return QColor(int(r), int(g), int(b))

    def get_color_from_gradient(self, gradient_colors, value):

        if( self.get_limits()[0] == self.get_limits()[1]):
            t = 0.5
        else:
            t = (value-self.get_limits()[0])/(self.get_limits()[1]-self.get_limits()[0])

        """t in [0,1], return color interpolated on gradient list."""
        if len(gradient_colors) == 1:
            return gradient_colors[0]

        n = len(gradient_colors) - 1
        scaled_t = t * n
        index = int(scaled_t)
        frac = scaled_t - index
        if index >= n:
            return gradient_colors[-1]
        return self.interpolate_color(gradient_colors[index], gradient_colors[index + 1], frac)

    def get_limits(self):       
        species = self.species_combo.currentText()

        if self.scene.results is None or not species:
            return (0,1)
        try:
            min_species = min(
                min(results[species]) for _, results in self.scene.results.items()
            )

            max_species = max(
                max(results[species]) for _, results in self.scene.results.items()
            )

            a = (max_species+min_species)/2 + (max_species-min_species)/2*1.5
            b = max((max_species+min_species)/2 - (max_species-min_species)/2*1.5,0)
            return (b,a)

        except KeyError:
            return (0,1)
        

    def setup_times(self):
        if self.scene.results is not None:
            min_time = min(r.index.min() for _, r in self.scene.results.items())
            max_time = max(r.index.max() for _, r in self.scene.results.items())
            self.time_slider.setRange(min_time, max_time)
            self.time_slider.setValue(min_time)
            self.time_label.setText(f"Time: {min_time}")

    def update_node_colors(self):
        gradient_name = self.gradient_combo.currentText()
        gradient_colors = self.get_gradient_colors(gradient_name)
        time = self.time_slider.value()
        species = self.species_combo.currentText()

        nodes = [item for item in self.scene.items() if isinstance(item, Node)]

        for node in nodes:
            if (self.scene.results is None or not species):
                c = QColor("darkgray")
            else:
                try:
                    closest_time = min(self.scene.results[node.model.name].index, key=lambda x: abs(x - time))
                    value = self.scene.results[node.model.name][species][closest_time]
                    if isinstance(value, pd.Series):
                        value = value.iloc[-1]
                    c = self.get_color_from_gradient(gradient_colors, value)
                except KeyError:
                    c = QColor("darkgray")
            node.setBrush(c)


class LegendWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.gradient_colors = [QColor("red"), QColor("blue")]
        self.limits = (0,1)
        self.setFixedHeight(90)
        self.setMinimumWidth(300)
        self.setToolTip("Color Legend")

    def setGradientColors(self, colors):
        self.gradient_colors = colors
        self.update()

    def setLimits(self, limits):
        self.limits = limits
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        rect = self.rect()

        # Draw background
        painter.fillRect(rect, QColor(30, 30, 30))

        # Draw gradient bar
        gradient_rect = QRectF(50, 10, rect.width() - 100, 15)
        gradient = QLinearGradient(gradient_rect.topLeft(), gradient_rect.topRight())

        # Add stops based on gradient_colors with brightness applied
        n = len(self.gradient_colors)
        for i, c in enumerate(self.gradient_colors):
            # Adjust brightness
            h, s, v, a = c.getHsv()
            v = max(0, min(255, int(v * 1)))
            bright_color = QColor()
            bright_color.setHsv(h, s, v, a)
            gradient.setColorAt(i / (n - 1 if n > 1 else 1), bright_color)

        painter.fillRect(gradient_rect, QBrush(gradient))
        painter.setPen(QPen(QColor("white")))
        painter.drawRect(gradient_rect)

        # Draw numeric labels limit[0] to limit[1] below gradient bar
        for i in range(6):
            x = gradient_rect.left() + i * (gradient_rect.width() / 5)
            value = self.limits[0] + (i/5)*(self.limits[1]-self.limits[0])
            label = f"{value:.4g}"
            painter.drawText(x - 80, gradient_rect.bottom() + 15, 160, 15, Qt.AlignCenter, label)


class WindowClass(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.view = ViewClass()
        self.initMenuBar()
        self.setCentralWidget(self.view)

        self.legend = LegendWidget(self.view)

        self.controls = ControlPanelWidget(self.view.scene())
        self.controls.gradient_combo.currentIndexChanged.connect(self.updateLegend)
        self.controls.species_combo.currentIndexChanged.connect(self.updateLegend)
        self.controls.time_slider.valueChanged.connect(self.updateLegend)

        dock = QDockWidget("Controls", self)
        dock.setWidget(self.controls)
        dock.setAllowedAreas(Qt.BottomDockWidgetArea | Qt.TopDockWidgetArea)
        self.addDockWidget(Qt.BottomDockWidgetArea, dock)  # Now dock widget is added properly

        
        dock2 = QDockWidget("Legend", self)
        dock2.setWidget(self.legend)
        dock2.setAllowedAreas(Qt.BottomDockWidgetArea | Qt.TopDockWidgetArea)
        self.addDockWidget(Qt.TopDockWidgetArea, dock2)  # Now dock widget is added properly


        self.updateLegend()

    def updateLegend(self):
        gradient_name = self.controls.gradient_combo.currentText()
        gradient_colors = self.controls.get_gradient_colors(gradient_name)
        limits = self.controls.get_limits()
        self.legend.setGradientColors(gradient_colors)
        self.legend.setLimits(limits)

    def initMenuBar(self):
        menubar = self.menuBar()
        file_menu = menubar.addMenu("File")

        save_action = QAction("Save Graph", self)
        save_action.triggered.connect(self.saveGraph)
        file_menu.addAction(save_action)

        load_action = QAction("Load Graph", self)
        load_action.triggered.connect(self.loadGraph)
        file_menu.addAction(load_action)

        
        load_results_action = QAction("Load Results", self)
        load_results_action.triggered.connect(self.loadResults)
        file_menu.addAction(load_results_action)

    def saveGraph(self):
        save_graph_to_file(self.view.s.graph, self)

    
    def loadResults(self):

        self.view.s.results = load_dataframes_from_pickles()
        self.controls.setup_times()        

    def loadGraph(self):
        graph = load_graph_from_file(self)
        if graph:
            self.view.s.clear()  # Clear scene
            self.view.s.graph = graph
            node_items = []
            for node_model in graph.nodes:
                node_item = Node()
                node_item.bind_model(node_model)
                self.view.s.addItem(node_item)
                node_item.setPos(node_model.x, node_model.y)
                node_item.setRect(0, 0, node_model.width, node_model.height)
                node_items.append(node_item)

            for edge_model in graph.edges:
                src_idx = graph.nodes.index(edge_model.source)
                tgt_idx = graph.nodes.index(edge_model.target)
                edge_item = Edge(node_items[src_idx], node_items[tgt_idx])
                edge_item.name = edge_model.name
                edge_item.bind_model(edge_model)
                self.view.s.addItem(edge_item)
                edge_item.adjust()


if __name__ == '__main__':
    app = QApplication(sys.argv)
    wd = WindowClass()
    wd.show()
    sys.exit(app.exec())
