import unittest
import pickle
from multiroom_model.inchemrunner import InChemPyRunner
from multiroom_model.inchem import InChemPyInstance
from modules.initial_dictionaries_class import InititialTxtFile, InitialPickleFile, InitialDataFrame
from numpy.testing import assert_allclose


class TestInChemPyClassResults(unittest.TestCase):
    # def test_run_inchem_py_to_get_results(self):
    #    inchem_py_instance: InChemPyInstance = InChemPyInstance(
    #        particles=False,
    #        INCHEM_additional=False,
    #        seconds_to_integrate=360,
    #        output_graph=False)
    #
    #    inchem_py_instance.run()

    #def test_run_inchem_py_to_get_results(self):
    #    inchem_py_instance: InChemPyInstance = InChemPyInstance(
    #        particles=False,
    #        INCHEM_additional=False,
    #        seconds_to_integrate=180,
    #        output_graph=False)
    #    inchem_py_instance.run()
    #    inchem_py_instance = InChemPyInstance(
    #        particles=False,
    #        INCHEM_additional=False,
    #        initials_from_run=True,
    #        t0=180,
    #        seconds_to_integrate=180,
    #        output_graph=False)
    #    inchem_py_instance.run()

    def benchmark_results(self):
        with open('multiroom_model_tests/test_run_inchem_py_to_get_results.pickle', 'rb') as file:
            result = pickle.load(file)
        return result

    def test_single_phase_run_results_repeatable(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        output_concentrations_A, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=180)

        output_concentrations_B, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=180)

        self.assertEqual(4, len(output_concentrations_A))
        self.assertEqual(4, len(output_concentrations_B))

        for species in inchem_py_runner.species():
            self.assertEqual(output_concentrations_A.get(species)[0.0],
                             output_concentrations_B.get(species)[0.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations_A.get(species)[60.0],
                             output_concentrations_B.get(species)[60.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations_A.get(species)[120.0],
                             output_concentrations_B.get(species)[120.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations_A.get(species)[180.0],
                             output_concentrations_B.get(species)[180.0], f"species check failed: {species}")

    def test_single_phase_run_results_match_double_phase(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        output_concentrations_A1, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=180)

        initial_conditions_b = InitialDataFrame(output_concentrations_A1)

        output_concentrations_A2, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions_b, t0=180, seconds_to_integrate=180)

        output_concentrations_B, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=360)

        self.assertEqual(4, len(output_concentrations_A1))
        self.assertEqual(4, len(output_concentrations_A2))
        self.assertEqual(7, len(output_concentrations_B))

        for species in inchem_py_runner.species():
            self.assertEqual(output_concentrations_A1.get(species)[0.0],
                             output_concentrations_B.get(species)[0.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations_A1.get(species)[60.0],
                             output_concentrations_B.get(species)[60.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations_A1.get(species)[120.0],
                             output_concentrations_B.get(species)[120.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations_A1.get(species)[180.0],
                             output_concentrations_B.get(species)[180.0], f"species check failed: {species}")

            assert_allclose(output_concentrations_A2.get(species)[180.0],
                            output_concentrations_B.get(species)[180.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")
            assert_allclose(output_concentrations_A2.get(species)[240.0],
                            output_concentrations_B.get(species)[240.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")
            assert_allclose(output_concentrations_A2.get(species)[300.0],
                            output_concentrations_B.get(species)[300.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")
            assert_allclose(output_concentrations_A2.get(species)[360.0],
                            output_concentrations_B.get(species)[360.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")

    def test_single_phase_run_matches_instance(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        output_concentrations, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=360)

        benchmark_concentrations = self.benchmark_results()

        for species in inchem_py_runner.species():
            self.assertEqual(output_concentrations.get(species)[0.0],
                             benchmark_concentrations.get(species)[0.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[60.0],
                             benchmark_concentrations.get(species)[60.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[120.0],
                             benchmark_concentrations.get(species)[120.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[180.0],
                             benchmark_concentrations.get(species)[180.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[240.0],
                             benchmark_concentrations.get(species)[240.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[300.0],
                             benchmark_concentrations.get(species)[300.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[360.0],
                             benchmark_concentrations.get(species)[360.0], f"species check failed: {species}")

    def test_double_phase_run_matches_instance(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        interim_concentrations, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=180)
        output_concentrations, _ = inchem_py_runner.run(
            initial_conditions=InitialDataFrame(interim_concentrations), t0=180, seconds_to_integrate=180)

        benchmark_concentrations = self.benchmark_results()

        for species in inchem_py_runner.species():
            self.assertEqual(interim_concentrations.get(species)[0.0],
                             benchmark_concentrations.get(species)[0.0], f"species check failed: {species}")
            self.assertEqual(interim_concentrations.get(species)[60.0],
                             benchmark_concentrations.get(species)[60.0], f"species check failed: {species}")
            self.assertEqual(interim_concentrations.get(species)[120.0],
                             benchmark_concentrations.get(species)[120.0], f"species check failed: {species}")
            self.assertEqual(interim_concentrations.get(species)[180.0],
                             benchmark_concentrations.get(species)[180.0], f"species check failed: {species}")
            assert_allclose(output_concentrations.get(species)[240.0],
                            benchmark_concentrations.get(species)[240.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")
            assert_allclose(output_concentrations.get(species)[300.0],
                            benchmark_concentrations.get(species)[300.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")
            assert_allclose(output_concentrations.get(species)[360.0],
                            benchmark_concentrations.get(species)[360.0],
                            rtol=1.0e-3, atol=1.0e-17, err_msg=f"species check failed: {species}")

    def test_double_phase_run_matches_double_phase_instance(self):
        inchem_py_runner: InChemPyRunner = InChemPyRunner(
            particles=False,
            INCHEM_additional=False,
            output_graph=False)

        initial_conditions = InititialTxtFile('initial_concentrations.txt')

        interim_concentrations, _ = inchem_py_runner.run(
            initial_conditions=initial_conditions, seconds_to_integrate=180)
        output_concentrations, _ = inchem_py_runner.run(
            initial_conditions=InitialDataFrame(interim_concentrations), t0=180, seconds_to_integrate=180)

        with open('multiroom_model_tests/run_0_to_180.pickle', 'rb') as file:
            benchmark_1 = pickle.load(file)

        with open('multiroom_model_tests//run_180_to_360.pickle', 'rb') as file:
            benchamark_2 = pickle.load(file)

        for species in inchem_py_runner.species():
            self.assertEqual(interim_concentrations.get(species)[0.0],
                             benchmark_1.get(species)[0.0], f"species check failed: {species}")
            self.assertEqual(interim_concentrations.get(species)[60.0],
                             benchmark_1.get(species)[60.0], f"species check failed: {species}")
            self.assertEqual(interim_concentrations.get(species)[120.0],
                             benchmark_1.get(species)[120.0], f"species check failed: {species}")
            self.assertEqual(interim_concentrations.get(species)[180.0],
                             benchmark_1.get(species)[180.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[180.0],
                             benchamark_2.get(species)[180.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[240.0],
                             benchamark_2.get(species)[240.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[300.0],
                             benchamark_2.get(species)[300.0], f"species check failed: {species}")
            self.assertEqual(output_concentrations.get(species)[360.0],
                             benchamark_2.get(species)[360.0], f"species check failed: {species}")
