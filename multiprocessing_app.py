from multiprocessing import Pool
import os
import time
from subprocess import run, TimeoutExpired


def do_work(args):
    start = time.time()
    try:
        run(args, timeout=4)
    except TimeoutExpired:
        print(f"Timeout of process: {args}")
        return None, args
    item_duration = round(time.time() - start)
    return item_duration, args


if __name__ == "__main__":
    cwd = os.path.dirname(os.path.realpath(__file__))
    exePath = os.path.join(cwd, "golang.exe")

    work_items = list(map(lambda x: [exePath, f"{x}", f"some_argument_{x}"], list(range(8))))

    start_time = time.time()

    with Pool() as pool:
        results = pool.map(do_work, work_items)

    duration = time.time() - start_time

    done_items = {}
    for result in results:
        if result[0]:
            done_items[result[1][1]] = result[0]

    timeout_items = set()
    for result in results:
        if not result[0]:
            timeout_items.add(result[1][1])

    print(done_items)
    print(timeout_items)

    print(done_items["1"])
    print("5" in done_items)

    print(f"Python: done {len(work_items)} in {round(duration)} seconds.")
