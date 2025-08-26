from PySide6.QtWidgets import (
    QWidget, QFormLayout, QCheckBox, QLineEdit,
    QDoubleSpinBox, QComboBox, QDateEdit, QPushButton,
    QFileDialog, QVBoxLayout, QApplication
)
from PySide6.QtCore import QDate
import sys
from dataclasses import dataclass

# Your existing GlobalSettings class (simplified with dataclass for brevity)
@dataclass
class GlobalSettings:
    filename: str = 'chem_mech/mcm_subset.fac'
    INCHEM_additional: bool = False
    particles: bool = False
    constrained_file: str = None
    output_folder: str = None
    dt: float = 0.002
    H2O2_dep: bool = False
    O3_dep: bool = False
    custom: bool = False
    custom_filename: str = None
    diurnal: bool = False
    city: str = 'London_urban'
    date: str = '21-06-2020'
    lat: float = 45.4
    path: str = None
    reactions_output: bool = False

class GlobalSettingsEditor(QWidget):
    def __init__(self, settings: GlobalSettings):
        super().__init__()
        self.settings = settings
        self.setWindowTitle("Global Settings Editor")

        layout = QVBoxLayout()
        form = QFormLayout()

        # File inputs
        self.filename_edit = QLineEdit(self.settings.filename)
        form.addRow("MCM Filename", self.filename_edit)

        self.constrained_file_edit = QLineEdit(self.settings.constrained_file or "")
        form.addRow("Constrained File", self.constrained_file_edit)

        self.output_folder_edit = QLineEdit(self.settings.output_folder or "")
        form.addRow("Output Folder", self.output_folder_edit)

        self.custom_filename_edit = QLineEdit(self.settings.custom_filename or "")
        form.addRow("Custom Filename", self.custom_filename_edit)

        self.path_edit = QLineEdit(self.settings.path or "")
        form.addRow("Path", self.path_edit)

        # Booleans
        self.checkboxes = {}
        for attr in ['INCHEM_additional', 'particles', 'H2O2_dep', 'O3_dep', 'custom', 'diurnal', 'reactions_output']:
            cb = QCheckBox()
            cb.setChecked(getattr(self.settings, attr))
            form.addRow(attr.replace('_', ' ').title(), cb)
            self.checkboxes[attr] = cb

        # Float input
        self.dt_spin = QDoubleSpinBox()
        self.dt_spin.setDecimals(6)
        self.dt_spin.setValue(self.settings.dt)
        self.dt_spin.setSingleStep(0.001)
        form.addRow("Time Step (dt)", self.dt_spin)

        # City dropdown
        self.city_combo = QComboBox()
        self.city_combo.addItems(["London_urban", "London_suburban", "Bergen_urban"])
        index = self.city_combo.findText(self.settings.city)
        if index >= 0:
            self.city_combo.setCurrentIndex(index)
        form.addRow("City", self.city_combo)

        # Date picker
        self.date_edit = QDateEdit()
        day, month, year = map(int, self.settings.date.split('-'))
        self.date_edit.setDate(QDate(year, month, day))
        self.date_edit.setCalendarPopup(True)
        form.addRow("Date", self.date_edit)

        layout.addLayout(form)

        # Save button
        save_button = QPushButton("Save Settings")
        save_button.clicked.connect(self.save_settings)
        layout.addWidget(save_button)

        self.setLayout(layout)

    def save_settings(self):
        self.settings.filename = self.filename_edit.text()
        self.settings.constrained_file = self.constrained_file_edit.text() or None
        self.settings.output_folder = self.output_folder_edit.text() or None
        self.settings.custom_filename = self.custom_filename_edit.text() or None
        self.settings.path = self.path_edit.text() or None
        self.settings.dt = self.dt_spin.value()
        self.settings.city = self.city_combo.currentText()
        self.settings.date = self.date_edit.date().toString("dd-MM-yyyy")

        for attr, checkbox in self.checkboxes.items():
            setattr(self.settings, attr, checkbox.isChecked())

        print("Updated settings:")
        print(self.settings)

# To run the widget
if __name__ == "__main__":
    app = QApplication(sys.argv)
    settings = GlobalSettings()
    editor = GlobalSettingsEditor(settings)
    editor.show()
    sys.exit(app.exec())
