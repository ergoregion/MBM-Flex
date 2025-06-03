from modules.initial_dictionaries import initial_conditions


class InititialTxtFile:
    initial_filename: str = ''

    def __init__(self, filename: str):
        self.initial_filename = filename

    def initial_conditions(self, M, species, rate_numba, calc_dict, particles, t0):
        return initial_conditions(self.initial_filename, M, species, rate_numba, calc_dict, particles, False, t0, None)


class InitialPickleFile:
    path: str = None

    def __init__(self, path: str):
        self.path = path

    def initial_conditions(self, M, species, rate_numba, calc_dict, particles, t0):
        return initial_conditions(None, M, species, rate_numba, calc_dict, particles, True, t0, self.path)


class InitialDataFrame:
    in_data = None

    def __init__(self, dataframe):
        self.in_data = dataframe

    def initial_conditions(self, M, species, rate_numba, calc_dict, particles, t0):
        density_dict = {}
        for i in species:
            density_dict[i] = self.in_data[i].loc[t0]

        if particles and 'SEED_1' not in density_dict:
            density_dict['SEED_1'] = 2.09e10
            density_dict['SEED'] = density_dict['SEED_1']*1.33e-4

        for i in rate_numba:
            calc_dict[i[0]] = eval(i[1], {}, {**density_dict, **calc_dict})
        return density_dict, calc_dict
