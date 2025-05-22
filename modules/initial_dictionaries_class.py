from .initial_dictionaries import initial_conditions


class InititialTxtFile:
    initial_filename: str = ''

    def __init__(self, filename: str):
        self.initial_filename = filename

    def initial_conditions(self, M, species, rate_numba, calc_dict, particles, t0):
        return initial_conditions(self.initial_filename, M, species, rate_numba, calc_dict, particles, False, t0, None)


class InitialPickleFile:
    path = None

    def initial_conditions(self, M, species, rate_numba, calc_dict, particles, t0):
        return initial_conditions(None, M, species, rate_numba, calc_dict, particles, True, t0, self.path)


class InitialDataFrame:
    in_data = None
    index_import = -1

    def initial_conditions(self, M, species, rate_numba, calc_dict, particles, t0):
        density_dict = {}
        for i in species:
            try:
                density_dict[i] = self.in_data.loc[self.index_import, i]
            except KeyError:
                # if new species added since imported run set it to 0
                density_dict[i] = 0

        if particles and 'SEED_1' not in density_dict:
            density_dict['SEED_1'] = 2.09e10
            density_dict['SEED'] = density_dict['SEED_1']*1.33e-4

        for i in rate_numba:
            calc_dict[i[0]] = eval(i[1], {}, {**density_dict, **calc_dict})
        return density_dict, calc_dict
