from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QFormLayout,
    QLineEdit, QLabel, QPushButton, QDoubleSpinBox, QDialog, QTableWidget,
    QTableWidgetItem, QHeaderView, QSpinBox, QComboBox, QGroupBox, QMessageBox
)
from PySide6.QtCore import Qt
from typing import List, Tuple, Dict, Optional
import sys


### === Models === ###
class TimeDependentValue:
    def __init__(self, values: List[Tuple[float, float]]):
        if len(values) == 0:
            raise Exception("no times provided")
        for i in range(len(values)-1):
            if values[i][0] >= values[i+1][0]:
                raise Exception("times not in order")
        self._values = values

    def values(self):
        return self._values


class TimeBracketedValue:
    def __init__(self, values: List[Tuple[float, float, float]]):
        if len(values) == 0:
            raise Exception("no times provided")
        for i in range(len(values)):
            if values[i][0] >= values[i][1]:
                raise Exception("start time must be < end time")
        self._values = values

    def values(self):
        return self._values

class RoomComposition:
    soft: float = 0
    paint: float = 0
    wood: float = 0
    metal: float = 0
    concrete: float = 0
    paper: float = 0
    lino: float = 0
    plastic: float = 0
    glass: float = 0
    human: float = 0
    other: float = 100


class Room:
    def __init__(
        self,
        volume_in_m3: float,
        surf_area_in_m2: float,
        light_type: str,
        glass_type: str,
        temp_in_kelvin: Optional[TimeDependentValue] = None,
        rh_in_percent: Optional[TimeDependentValue] = None,
        airchange_in_per_second: Optional[TimeDependentValue] = None,
        light_switch: Optional[TimeDependentValue] = None,
        emissions: Optional[Dict[str, TimeBracketedValue]] = None,
        n_adults: Optional[TimeDependentValue] = None,
        n_children: Optional[TimeDependentValue] = None,
        composition: Optional[RoomComposition] = None
    ):
        self.volume_in_m3 = volume_in_m3
        self.surf_area_in_m2 = surf_area_in_m2
        self.light_type = light_type
        self.glass_type = glass_type
        self.temp_in_kelvin = temp_in_kelvin
        self.rh_in_percent = rh_in_percent
        self.airchange_in_per_second = airchange_in_per_second
        self.light_switch = light_switch
        self.emissions = emissions or {}
        self.n_adults = n_adults
        self.n_children = n_children
        self.composition = composition or RoomComposition()


### === Widgets === ###
from PySide6.QtWidgets import (
    QWidget, QToolButton, QVBoxLayout, QFrame, QSizePolicy, QHBoxLayout, QLabel
)
from PySide6.QtCore import Qt


class CollapsibleSection(QWidget):
    def __init__(self, title: str = "", parent=None):
        super().__init__(parent)

        self.toggle_button = QToolButton(text=title)
        self.toggle_button.setStyleSheet("QToolButton { border: none; }")
        self.toggle_button.setToolButtonStyle(Qt.ToolButtonTextBesideIcon)
        self.toggle_button.setArrowType(Qt.RightArrow)
        self.toggle_button.setCheckable(True)
        self.toggle_button.setChecked(False)

        self.header_layout = QHBoxLayout()
        self.header_layout.addWidget(self.toggle_button)
        self.header_layout.addStretch()

        self.content_area = QFrame()
        self.content_area.setStyleSheet("QFrame { background-color: #f9f9f9; }")
        self.content_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        self.content_area.setVisible(False)

        self.main_layout = QVBoxLayout(self)
        self.main_layout.setSpacing(0)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.addLayout(self.header_layout)
        self.main_layout.addWidget(self.content_area)

        self.toggle_button.toggled.connect(self.on_toggled)

        self._content_layout = QVBoxLayout()
        self.content_area.setLayout(self._content_layout)

    def on_toggled(self, checked):
        self.content_area.setVisible(checked)
        self.toggle_button.setArrowType(Qt.DownArrow if checked else Qt.RightArrow)

    def setContentLayout(self, layout: QVBoxLayout):
        # Replace the inner content layout
        QWidget().setLayout(self._content_layout)  # Delete old layout
        self._content_layout = layout
        self.content_area.setLayout(self._content_layout)

    def isExpanded(self):
        return self.toggle_button.isChecked()

from PySide6.QtWidgets import (
    QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QMessageBox, QHeaderView
)
from typing import Optional

class RoomCompositionEditor(CollapsibleSection):
    def __init__(self, composition: RoomComposition, parent=None):
        super().__init__("Room Composition", parent)

        self.composition = composition

        # Container widget inside the collapsible content
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(10, 5, 10, 5)
        layout.setSpacing(8)

        # Create editors for each field except "other" (calculated)
        self.spinboxes = {}
        fields = [
            'soft', 'paint', 'wood', 'metal', 'concrete',
            'paper', 'lino', 'plastic', 'glass', 'human'
        ]

        for field in fields:
            h_layout = QHBoxLayout()
            label = QLabel(field.capitalize())
            label.setMinimumWidth(80)
            spin = QDoubleSpinBox()
            spin.setRange(0.0, 100.0)
            spin.setDecimals(2)
            spin.setSingleStep(0.1)
            spin.setValue(getattr(self.composition, field, 0.0))
            spin.valueChanged.connect(self.on_value_changed)
            self.spinboxes[field] = spin

            h_layout.addWidget(label)
            h_layout.addWidget(spin)
            layout.addLayout(h_layout)

        # Display "other" as read-only label that auto-calculates to sum to 100%
        self.other_label = QLabel()
        self.other_label.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self.other_label.setStyleSheet("color: gray; font-style: italic;")
        self.update_other_label()

        other_layout = QHBoxLayout()
        other_layout.addWidget(QLabel("Other"))
        other_layout.addWidget(self.other_label)
        layout.addLayout(other_layout)

        self.setContentLayout(layout)

        # Expand by default or not, your choice
        # self.toggle_button.setChecked(True)

    def on_value_changed(self, _):
        # Update the composition with spinbox values
        total = 0.0
        for field, spinbox in self.spinboxes.items():
            val = spinbox.value()
            setattr(self.composition, field, val)
            total += val

        # Calculate "other"
        other = max(0.0, 100.0 - total)
        self.composition.other = other
        self.update_other_label()

    def update_other_label(self):
        self.other_label.setText(f"{self.composition.other:.2f} %")

    
    def get_composition(self):
        return self.composition

class TimeValueEditor(CollapsibleSection):
    """Collapsible editor for TimeDependentValue"""

    def __init__(self, label="Time Dependent Value"):
        super().__init__(label)

        self.table = QTableWidget(0, 2)
        self.table.setHorizontalHeaderLabels(["Time", "Value"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)

        layout = QVBoxLayout()
        layout.addWidget(self.table)

        btns = QHBoxLayout()
        add_btn = QPushButton("Add")
        remove_btn = QPushButton("Remove")
        btns.addWidget(add_btn)
        btns.addWidget(remove_btn)
        layout.addLayout(btns)

        add_btn.clicked.connect(self.add_row)
        remove_btn.clicked.connect(self.remove_row)

        self.setContentLayout(layout)

    def add_row(self):
        row = self.table.rowCount()
        self.table.insertRow(row)
        self.table.setItem(row, 0, QTableWidgetItem("0.0"))
        self.table.setItem(row, 1, QTableWidgetItem("0.0"))

    def remove_row(self):
        selected = self.table.currentRow()
        if selected >= 0:
            self.table.removeRow(selected)

    def get_value(self) -> Optional[TimeDependentValue]:
        if not self.isExpanded():
            return None
        try:
            values = []
            for row in range(self.table.rowCount()):
                time = float(self.table.item(row, 0).text())
                val = float(self.table.item(row, 1).text())
                values.append((time, val))
            values.sort()
            return TimeDependentValue(values)
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))
            return None


class BracketedValueEditor(CollapsibleSection):
    """Collapsible editor for TimeBracketedValue"""

    def __init__(self, label="Time Bracketed Value"):
        super().__init__(label)

        self.table = QTableWidget(0, 3)
        self.table.setHorizontalHeaderLabels(["Start", "End", "Value"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)

        layout = QVBoxLayout()
        layout.addWidget(self.table)

        btns = QHBoxLayout()
        add_btn = QPushButton("Add")
        remove_btn = QPushButton("Remove")
        btns.addWidget(add_btn)
        btns.addWidget(remove_btn)
        layout.addLayout(btns)

        add_btn.clicked.connect(self.add_row)
        remove_btn.clicked.connect(self.remove_row)

        self.setContentLayout(layout)

    def add_row(self):
        row = self.table.rowCount()
        self.table.insertRow(row)
        self.table.setItem(row, 0, QTableWidgetItem("0.0"))
        self.table.setItem(row, 1, QTableWidgetItem("1.0"))
        self.table.setItem(row, 2, QTableWidgetItem("10.0"))

    def remove_row(self):
        selected = self.table.currentRow()
        if selected >= 0:
            self.table.removeRow(selected)

    def get_value(self) -> Optional[TimeBracketedValue]:
        if not self.isExpanded():
            return None
        try:
            values = []
            for row in range(self.table.rowCount()):
                start = float(self.table.item(row, 0).text())
                end = float(self.table.item(row, 1).text())
                val = float(self.table.item(row, 2).text())
                values.append((start, end, val))
            return TimeBracketedValue(values)
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))
            return None


from PySide6.QtWidgets import (
    QWidget, QListWidget, QPushButton, QVBoxLayout, QHBoxLayout, QMessageBox, QInputDialog, QLabel
)

class EmissionsEditor(CollapsibleSection):
    def __init__(self, emissions: dict = None):
        super().__init__("Emissions")
        
        self.emissions = emissions if emissions is not None else {}

        # Container widget inside content_area to hold layout
        container = QWidget()
        layout = QVBoxLayout(container)

        # Species list + buttons
        hlayout = QHBoxLayout()
        self.species_list = QListWidget()
        hlayout.addWidget(self.species_list)

        btn_layout = QVBoxLayout()
        self.add_btn = QPushButton("Add Species")
        self.remove_btn = QPushButton("Remove Species")
        btn_layout.addWidget(self.add_btn)
        btn_layout.addWidget(self.remove_btn)
        btn_layout.addStretch()
        hlayout.addLayout(btn_layout)

        layout.addLayout(hlayout)

        # Label showing current species
        self.current_label = QLabel("Select a species to edit emissions")
        layout.addWidget(self.current_label)

        # BracketedValueEditor for selected species
        self.bracketed_editor = BracketedValueEditor("Emissions for selected species")
        layout.addWidget(self.bracketed_editor)

        self.bracketed_editor.setEnabled(False)

        # Populate species list
        for species in self.emissions.keys():
            self.species_list.addItem(species)
        
        self.setContentLayout(layout)

        # Connections
        self.add_btn.clicked.connect(self.add_species)
        self.remove_btn.clicked.connect(self.remove_species)
        self.species_list.currentItemChanged.connect(self.species_changed)
        self.bracketed_editor.toggle_button.toggled.connect(self.bracketed_changed)

    def add_species(self):
        text, ok = QInputDialog.getText(self, "Add Species", "Species name:")
        if ok and text:
            if text in self.emissions:
                QMessageBox.warning(self, "Duplicate Species", f"Species '{text}' already exists.")
                return
            self.emissions[text] = TimeBracketedValue([(0.0, 1.0, 0.0)])  # empty default
            self.species_list.addItem(text)
            self.species_list.setCurrentRow(self.species_list.count() - 1)

    def remove_species(self):
        current_item = self.species_list.currentItem()
        if current_item:
            species = current_item.text()
            confirm = QMessageBox.question(self, "Confirm Remove", f"Remove species '{species}'?")
            if confirm == QMessageBox.Yes:
                del self.emissions[species]
                self.species_list.takeItem(self.species_list.currentRow())
                self.bracketed_editor.setEnabled(False)
                self.bracketed_editor.toggle_button.setChecked(False)
                self.current_label.setText("Select a species to edit emissions")

    def species_changed(self, current, previous=None):
        if current is None:
            self.bracketed_editor.setEnabled(False)
            self.bracketed_editor.toggle_button.setChecked(False)
            self.current_label.setText("Select a species to edit emissions")
            return

        species = current.text()
        self.current_label.setText(f"Editing Emissions for: {species}")

        tbv = self.emissions.get(species)
        if tbv:
            self.bracketed_editor.toggle_button.setChecked(True)
            self.bracketed_editor.table.setRowCount(0)
            for start, end, val in tbv._values:
                self.bracketed_editor.add_row()
                row = self.bracketed_editor.table.rowCount() - 1
                self.bracketed_editor.table.setItem(row, 0, QTableWidgetItem(str(start)))
                self.bracketed_editor.table.setItem(row, 1, QTableWidgetItem(str(end)))
                self.bracketed_editor.table.setItem(row, 2, QTableWidgetItem(str(val)))
            self.bracketed_editor.setEnabled(True)
        else:
            self.bracketed_editor.setEnabled(False)
            self.bracketed_editor.toggle_button.setChecked(False)

    def bracketed_changed(self, checked):
        if not checked:
            return
        current_item = self.species_list.currentItem()
        if not current_item:
            return
        species = current_item.text()
        val = self.bracketed_editor.get_value()
        if val:
            self.emissions[species] = val

    def get_emissions(self):
        return self.emissions

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QFormLayout, QLineEdit,
    QDoubleSpinBox, QComboBox, QDateEdit, QPushButton, QMessageBox
)
from PySide6.QtCore import QDate

class RoomEditor(QWidget):
    def __init__(self, room: Room, parent=None):
        super().__init__(parent)
        self.room = room  # Store reference to the existing Room instance

        layout = QVBoxLayout(self)

        form_layout = QFormLayout()

        # volume_in_m3
        self.volume_spin = QDoubleSpinBox()
        self.volume_spin.setRange(0.0, 1e6)
        self.volume_spin.setValue(room.volume_in_m3)
        form_layout.addRow("Volume (m³):", self.volume_spin)

        # surf_area_in_m2
        self.surface_spin = QDoubleSpinBox()
        self.surface_spin.setRange(0.0, 1e6)
        self.surface_spin.setValue(room.surf_area_in_m2)
        form_layout.addRow("Surface Area (m²):", self.surface_spin)

        # light_type
        self.light_type_edit = QLineEdit(room.light_type)
        form_layout.addRow("Light Type:", self.light_type_edit)

        # glass_type
        self.glass_type_edit = QLineEdit(room.glass_type)
        form_layout.addRow("Glass Type:", self.glass_type_edit)

        layout.addLayout(form_layout)
        
        # temp_in_kelvin (TimeDependentValue editor)
        self.temp_editor = TimeValueEditor("Temperature (K)")
        if room.temp_in_kelvin is not None:
            self._load_time_dependent_value(self.temp_editor, room.temp_in_kelvin)
        layout.addWidget(self.temp_editor)

        # rh_in_percent (TimeDependentValue editor)
        self.rh_editor = TimeValueEditor("Relative Humidity (%)")
        if room.rh_in_percent is not None:
            self._load_time_dependent_value(self.rh_editor, room.rh_in_percent)
        layout.addWidget(self.rh_editor)

        # airchange_in_per_second (TimeDependentValue editor)
        self.airchange_editor = TimeValueEditor("Air Change (1/s)")
        if room.airchange_in_per_second is not None:
            self._load_time_dependent_value(self.airchange_editor, room.airchange_in_per_second)
        layout.addWidget(self.airchange_editor)

        # light_switch (TimeDependentValue editor)
        self.light_switch_editor = TimeValueEditor("Light Switch")
        if room.light_switch is not None:
            self._load_time_dependent_value(self.light_switch_editor, room.light_switch)
        layout.addWidget(self.light_switch_editor)

        self.emissions_editor = EmissionsEditor(room.emissions)
        layout.addWidget(self.emissions_editor)

        self.composition_editor = RoomCompositionEditor(room.composition)
        layout.addWidget(self.composition_editor)

        # n_adults (TimeDependentValue)
        self.adults_editor = TimeValueEditor("Number of Adults")
        if room.n_adults is not None:
            self._load_time_dependent_value(self.adults_editor, room.n_adults)
        layout.addWidget(self.adults_editor)

        # n_children (TimeDependentValue)
        self.children_editor = TimeValueEditor("Number of Children")
        if room.n_children is not None:
            self._load_time_dependent_value(self.children_editor, room.n_children)
        layout.addWidget(self.children_editor)

        # Buttons
        btn_layout = QVBoxLayout()
        self.apply_btn = QPushButton("Apply")
        self.apply_btn.clicked.connect(self.apply_changes)
        btn_layout.addWidget(self.apply_btn)

        layout.addLayout(btn_layout)

    def _load_time_dependent_value(self, editor: TimeValueEditor, tdv: TimeDependentValue):
        editor.table.setRowCount(0)
        for t, v in tdv._values:
            editor.add_row()
            row = editor.table.rowCount() - 1
            editor.table.setItem(row, 0, QTableWidgetItem(str(t)))
            editor.table.setItem(row, 1, QTableWidgetItem(str(v)))

    def _load_bracketed_value(self, editor: BracketedValueEditor, tbv: TimeBracketedValue):
        editor.table.setRowCount(0)
        for start, end, val in tbv._values:
            editor.add_row()
            row = editor.table.rowCount() - 1
            editor.table.setItem(row, 0, QTableWidgetItem(str(start)))
            editor.table.setItem(row, 1, QTableWidgetItem(str(end)))
            editor.table.setItem(row, 2, QTableWidgetItem(str(val)))

    def apply_changes(self):
        try:
            self.room.volume_in_m3 = self.volume_spin.value()
            self.room.surf_area_in_m2 = self.surface_spin.value()
            self.room.light_type = self.light_type_edit.text()
            self.room.glass_type = self.glass_type_edit.text()

            self.room.temp_in_kelvin = self.temp_editor.get_value()
            self.room.rh_in_percent = self.rh_editor.get_value()
            self.room.airchange_in_per_second = self.airchange_editor.get_value()
            self.room.light_switch = self.light_switch_editor.get_value()

            self.room.emissions = self.emissions_editor.get_emissions()
            self.room.composition = self.composition_editor.get_composition()

            self.room.n_adults = self.adults_editor.get_value()
            self.room.n_children = self.children_editor.get_value()

            QMessageBox.information(self, "Success", "Room updated successfully!")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to apply changes: {e}")


### === Run === ###
if __name__ == "__main__":
    app = QApplication(sys.argv)
    existing_room = Room(50,30,"LED","Double Pane")
    existing_room.temp_in_kelvin = TimeDependentValue([(0, 295), (3600, 300)])
    existing_room.rh_in_percent = TimeDependentValue([(0, 40), (3600, 45)])
    existing_room.emissions = {
        "CO2": TimeBracketedValue([(0, 3600, 10.0)])
    }
    existing_room.n_adults = TimeDependentValue([(0, 2)])
    existing_room.n_children = TimeDependentValue([(0, 1)])

    # Create the editor with the existing room
    editor = RoomEditor(existing_room)
    editor.resize(800, 800)
    editor.show()
    sys.exit(app.exec())
