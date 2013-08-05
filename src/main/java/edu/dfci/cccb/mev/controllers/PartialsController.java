/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package edu.dfci.cccb.mev.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * @author levk
 * 
 */
@Controller
public class PartialsController {

  // TODO: figure out why slashes don't work and update
  // META-INF/resources/mev/js/app.js
  // http://stackoverflow.com/questions/18065716/requestmapping-with-slashes-fails-to-return-a-view
  @RequestMapping ("/views-partials-{view}")
  public String partial (@PathVariable ("view") String view) {
    return "partials/" + view;
  }

  @RequestMapping ("/views/partials/{view}")
  public String partial2 (@PathVariable ("view") String view) {
    return "/partials/" + view;
  }
}
