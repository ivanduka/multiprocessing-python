# import multiprocessing
# with multiprocessing.Pool() as pool:
#     pool.map(run, ["./gopl.io", work_items])

import time
from subprocess import run, PIPE
from threading import Timer


def do_work(arg):
    run(["./gopl.io", arg])


if __name__ == "__main__":
    work_items = list(map(lambda x: f"Item_{x}", list(range(2))))

    start_time = time.time()

    for work_item in work_items:
        do_work(work_item)

    duration = time.time() - start_time

    print(f"Done {len(work_items)} in {duration} seconds.")
