import multiprocessing

import time
from subprocess import run, PIPE


def do_work(args):
    run(args)


if __name__ == "__main__":
    work_items = list(map(lambda x: ["./gopl.io", f"{x}", f"some_argument_{x}"], list(range(8))))

    start_time = time.time()

    with multiprocessing.Pool() as pool:
        pool.map(do_work, work_items)

    duration = time.time() - start_time

    print(f"Python: done {len(work_items)} in {round(duration)} seconds.")
