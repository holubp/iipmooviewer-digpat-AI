IIPMooViewer
============


About
-----
Original IIPMooViewer is a high performance light-weight HTML5 Ajax-based javascript image streaming and zooming client designed for the IIPImage high resolution imaging system. This fork of IIPMooViewer aimed specifically at visualizations of results of machine learning (AI) on large digital pathology images. Designed to minimize changes of original IIPMooViewer.

Forked.

Features beyond original IIPMooViewer
-------------------------------------
* Specification of base image, annotation, and probabilities (results of learning) as URL parameters
* On the fly reprocessing of overlay layer to enable transparency.
* Thresholding of probabilites


Installation & Server & Configuration
-------------------------------------
See IIPMooViewer documentation.

Images
------
Create a pyramidal tiled TIFF image using VIPS (http://vips.sf.net).

For base images (whole slide scans):
* <pre>vips tiffsave source_image target_image.tif --tile --pyramid --compression=jpeg --Q=80 --tile-width 256 --tile-height 256 --bigtiff</pre>

For overlays (assuming images with relatively low entropy):
* <pre>vips tiffsave source_image target_image.tif --tile --pyramid --compression=deflate --tile-width 256 --tile-height 256 --bigtiff</pre>



<pre>(c) 2007-2019 Ruven Pillay <ruven@users.sourceforge.net>, 2019 Petr Holub <hopet@ics.muni.cz></pre>
