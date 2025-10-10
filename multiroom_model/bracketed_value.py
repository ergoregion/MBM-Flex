from typing import List, Tuple


class TimeBracketedValue:
    """
        @brief A class recording a variable takes a non-zero value for bracketed intervals of time
        Stored in the form of a list of tuples,
        each  tuple has a start time, end time, and a value 

    """

    def __init__(self, values: List[Tuple[float, float, float]]):

        #Check that some times were provided
        if len(values) == 0:
            raise Exception("no times provided")

        #Check that the end time comes after the start time
        for i in range(len(values)-1):
            if (values[i][0] >= values[i][1]):
                raise Exception("times were not in order")

        self._values: List[Tuple[float, float, float]] = values

    def value_at_time(self, t: float) -> float:
        """
        if the time is within a bracket return that value, otherwise return 0
        """

        #Loop through the brackets
        for i in range(len(self._values) - 1):
            t0, t1, v = self._values[i]
            #if t is in the bracket return the value
            if t0 <= t <= t1:
                return v

        #return 0 if there isn't a bracket around t
        return 0

    def values(self):
        return self._values

