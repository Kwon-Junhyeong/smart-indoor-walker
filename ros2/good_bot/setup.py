import os
from glob import glob

from setuptools import setup

package_name = "good_bot"

setup(
    name=package_name,
    version="0.0.0",
    packages=[package_name],
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        (os.path.join("share", package_name, "urdf"), glob("urdf/*.urdf")),
        (os.path.join("share", package_name, "launch"), glob("launch/*.launch.py")),
        (os.path.join("share", package_name, "config"), glob("config/*.lua")),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="Junhyeong Kwon",
    maintainer_email="meoruu00@gmail.com",
    description="Robot model and Cartographer launch files for the walker",
    license="MIT",
    entry_points={"console_scripts": []},
)
