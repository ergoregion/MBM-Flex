import unittest
from multiroom_model.inchemrunner import InChemPyRunner
from modules.initial_dictionaries_class import InititialTxtFile, InitialDataFrame


class TestInChemPyRunner(unittest.TestCase):
    def test_inchempy_runs(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_chem_mech_set(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/mcm_v331.fac",
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_escs_v1_set(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/escs_v1.fac",
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_rcs_2023_set(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/rcs_2023.fac",
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_mcm_subset_set(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/mcm_subset.fac",
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_chem_mech_set_and_additions(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/mcm_v331.fac",
            particles=True,
            INCHEM_additional=True,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_escs_v1_set_and_additions(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/escs_v1.fac",
            particles=True,
            INCHEM_additional=False,
            output_graph=False,
            automatically_fix_undefined_species=True)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_rcs_2023_set_and_additions(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/rcs_2023.fac",
            particles=True,
            INCHEM_additional=True,
            output_graph=False,
            automatically_fix_undefined_species=True)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_runs_with_mcm_subset_set_and_additions(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            filename="chem_mech/mcm_subset.fac",
            particles=True,
            INCHEM_additional=True,
            output_graph=False,
            automatically_fix_undefined_species=True)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        inchem_py_runner.run(initial_conditions=initial_conditions, seconds_to_integrate=180)

    def test_inchempy_run_in_2_phases(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        phase_1_output_concentrations, phase_1_times = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=180)

        initial_conditions = InitialDataFrame(phase_1_output_concentrations)

        output_concentrations, phase_2_times = inchem_py_runner.run(
            initial_conditions=initial_conditions, t0=180, seconds_to_integrate=180)

        self.assertEqual(4, len(phase_1_output_concentrations))
        self.assertEqual(4, len(output_concentrations))

        for species in inchem_py_runner.species():
            self.assertEqual(phase_1_output_concentrations.get(species)[180.0],
                             output_concentrations.get(species)[180.0], f"species check failed: {species}")


if __name__ == '__main__':
    unittest.main()
